package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"strings"
	"sync"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

var hlog = logrus.WithField("module", "handler")

const (
	lokiOrgIDHeader = "X-Scope-OrgID"
)

func newLokiClient(cfg *loki.Config) httpclient.HTTPClient {
	var headers map[string][]string
	if cfg.TenantID != "" {
		headers = map[string][]string{
			lokiOrgIDHeader: {cfg.TenantID},
		}
	}
	// TODO: loki with auth
	return httpclient.NewHTTPClient(cfg.Timeout, headers)
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

func executeLokiQuery(flowsURL string, lokiClient httpclient.HTTPClient) ([]byte, int, error) {
	hlog.Debugf("executeLokiQuery URL: %s", flowsURL)

	resp, code, err := lokiClient.Get(flowsURL)
	if err != nil {
		return nil, http.StatusServiceUnavailable, err
	}
	if code != http.StatusOK {
		msg := getLokiError(resp, code)
		return nil, http.StatusBadRequest, errors.New("Loki backend responded: " + msg)
	}
	return resp, http.StatusOK, nil
}

func fetchParallel(lokiClient httpclient.HTTPClient, queries []string) ([]byte, int, error) {
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
		return nil, errWithCode.code, errWithCode.err
	}

	// Aggregate results
	var aggregated model.QueryResponse
	var aggStreams model.Streams
	for r := range resChan {
		if streams, ok := r.Data.Result.(model.Streams); ok {
			if len(aggStreams) == 0 {
				aggStreams = streams
				aggregated = r
			} else {
				aggStreams = merge(aggStreams, streams)
				aggregated.Data.Result = aggStreams
			}
		} else {
			return nil, http.StatusInternalServerError, fmt.Errorf("loki returned an unexpected type: %T", r.Data.Result)
		}
	}

	// Encode back to json
	encoded, err := json.Marshal(aggregated)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return encoded, http.StatusOK, nil
}

func merge(into, from model.Streams) model.Streams {
	// TODO: o(n²), to optimize
	for _, stream := range from {
		found := false
		for _, existing := range into {
			if reflect.DeepEqual(stream, existing) {
				found = true
				break
			}
		}
		if !found {
			into = append(into, stream)
		}
	}
	return into
}
