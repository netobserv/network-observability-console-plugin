package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

var hlog = logrus.WithField("module", "handler")

const (
	lokiOrgIDHeader = "X-Scope-OrgID"
)

func newLokiClient(cfg *loki.Config) httpclient.Caller {
	var headers map[string][]string
	if cfg.TenantID != "" {
		headers = map[string][]string{
			lokiOrgIDHeader: {cfg.TenantID},
		}
	}
	// TODO: loki with auth
	return httpclient.NewHTTPClient(cfg.Timeout, headers, cfg.SkipTLS)
}

/* loki query will fail if spaces or quotes are not encoded
 * we can't use url.QueryEscape or url.Values here since Loki doesn't manage encoded parenthesis
 */
func EncodeQuery(url string) string {
	unquoted := strings.ReplaceAll(url, "\"", "%22")
	unspaced := strings.ReplaceAll(unquoted, " ", "%20")
	return unspaced
}

func getLokiError(resp []byte, code int) string {
	var f map[string]string
	err := json.Unmarshal(resp, &f)
	if err != nil {
		return fmt.Sprintf("Unknown error from Loki - cannot unmarshal (code: %d resp: %s)", code, resp)
	}
	message, ok := f["message"]
	if !ok {
		return fmt.Sprintf("Unknown error from Loki - no message found (code: %d)", code)
	}
	return fmt.Sprintf("Error from Loki (code: %d): %s", code, message)
}

func executeLokiQuery(flowsURL string, lokiClient httpclient.Caller) ([]byte, int, error) {
	hlog.Debugf("executeLokiQuery URL: %s", flowsURL)
	var code int
	startTime := time.Now()
	defer func() {
		metrics.ObserveLokiUnitCall(code, startTime)
	}()

	resp, code, err := lokiClient.Get(flowsURL)
	if err != nil {
		return nil, http.StatusServiceUnavailable, err
	}
	if code != http.StatusOK {
		msg := getLokiError(resp, code)
		return nil, http.StatusBadRequest, errors.New("Loki backend responded: " + msg)
	}
	code = http.StatusOK
	return resp, code, nil
}

func fetchSingle(lokiClient httpclient.Caller, flowsURL string, merger loki.Merger) (int, error) {
	var code int
	startTime := time.Now()
	defer func() {
		metrics.ObserveLokiParallelCall(fmt.Sprintf("%T", merger), code, 1, startTime)
	}()

	resp, code, err := executeLokiQuery(flowsURL, lokiClient)
	if err != nil {
		return code, err
	}
	var qr model.QueryResponse
	if err := json.Unmarshal(resp, &qr); err != nil {
		return http.StatusInternalServerError, err
	}
	if _, err := merger.Add(qr.Data); err != nil {
		return http.StatusInternalServerError, err
	}
	return code, nil
}

func fetchParallel(lokiClient httpclient.Caller, queries []string, merger loki.Merger) (int, error) {
	var codeOut int
	startTime := time.Now()
	defer func() {
		metrics.ObserveLokiParallelCall(fmt.Sprintf("%T", merger), codeOut, len(queries), startTime)
	}()

	// Run queries in parallel, then aggregate them
	resChan := make(chan model.QueryResponse, len(queries))
	errChan := make(chan errorWithCode, len(queries))
	var wg sync.WaitGroup
	wg.Add(len(queries))

	for _, q := range queries {
		go func(query string) {
			defer wg.Done()
			resp, code, err := executeLokiQuery(query, lokiClient)
			if err != nil {
				errChan <- errorWithCode{err: err, code: code}
			} else {
				var qr model.QueryResponse
				err := json.Unmarshal(resp, &qr)
				if err != nil {
					errChan <- errorWithCode{err: err, code: http.StatusInternalServerError}
				} else {
					resChan <- qr
				}
			}
		}(q)
	}

	wg.Wait()
	close(resChan)
	close(errChan)

	for errWithCode := range errChan {
		codeOut = errWithCode.code
		return errWithCode.code, errWithCode.err
	}

	// Aggregate results
	for r := range resChan {
		if _, err := merger.Add(r.Data); err != nil {
			codeOut = http.StatusInternalServerError
			return codeOut, err
		}
	}
	codeOut = http.StatusOK
	return codeOut, nil
}
