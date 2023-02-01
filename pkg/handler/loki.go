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
	"gopkg.in/yaml.v3"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/handler/lokiclientmock"
	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

type LokiError struct {
	DisplayMessage string
	Message        string
}

var hlog = logrus.WithField("module", "handler")

const (
	lokiOrgIDHeader = "X-Scope-OrgID"
)

func newLokiClient(cfg *loki.Config, requestHeader http.Header) httpclient.Caller {
	headers := map[string][]string{}
	if cfg.TenantID != "" {
		headers[lokiOrgIDHeader] = []string{cfg.TenantID}
	}

	if cfg.ForwardUserToken {
		token := requestHeader.Get(auth.AuthHeader)
		if token != "" {
			headers[auth.AuthHeader] = []string{token}
		} else {
			hlog.Debug("Missing Authorization token in user request")
		}
	} else if cfg.Authorization != "" {
		headers[auth.AuthHeader] = []string{cfg.Authorization}
	}

	if cfg.UseMocks {
		hlog.Debug("Mocking Loki Client")
		return new(lokiclientmock.LokiClientMock)
	}

	// TODO: loki with auth
	return httpclient.NewHTTPClient(cfg.Timeout, headers, cfg.SkipTLS, cfg.CAPath)
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
	if code == http.StatusBadRequest {
		return fmt.Sprintf("Loki message: %s", resp)
	}
	err := json.Unmarshal(resp, &f)
	if err != nil {
		hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
		return fmt.Sprintf("Unknown error from Loki\ncannot unmarshal\n%s", resp)
	}
	message, ok := f["message"]
	if !ok {
		return "Unknown error from Loki\nno message found"
	}
	return fmt.Sprintf("Loki message: %s", message)
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
		return nil, http.StatusBadRequest, errors.New(msg)
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
		hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
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
					hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
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

func LokiReady(cfg *loki.Config) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header)
		baseURL := strings.TrimRight(cfg.StatusURL.String(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "ready"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		status := string(resp)
		if strings.Contains(status, "ready") {
			code = http.StatusOK
			writeText(w, code, resp)
			return
		}

		writeError(w, code, fmt.Sprintf("Loki returned a non ready status: %s", status))
	}
}

func LokiMetrics(cfg *loki.Config) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header)
		baseURL := strings.TrimRight(cfg.StatusURL.String(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "metrics"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		writeText(w, code, resp)
	}
}

func LokiBuildInfos(cfg *loki.Config) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header)
		baseURL := strings.TrimRight(cfg.StatusURL.String(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "loki/api/v1/status/buildinfo"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		writeText(w, code, resp)
	}
}

func LokiConfig(cfg *loki.Config, param string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header)
		baseURL := strings.TrimRight(cfg.StatusURL.String(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "config"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		cfg := make(map[string]interface{})
		err = yaml.Unmarshal(resp, &cfg)
		if err != nil {
			hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
			writeError(w, code, err.Error())
			return
		}
		writeJSON(w, code, cfg[param])
	}
}
