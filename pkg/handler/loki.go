package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
)

var hlog = logrus.WithField("module", "handler")

const (
	exportCSVFormat = "csv"
	lokiOrgIDHeader = "X-Scope-OrgID"
)

type LokiConfig struct {
	URL      *url.URL
	Timeout  time.Duration
	TenantID string
	Labels   []string
}

func newLokiClient(cfg *LokiConfig) httpclient.HTTPClient {
	var headers map[string][]string
	if cfg.TenantID != "" {
		headers = map[string][]string{
			lokiOrgIDHeader: {cfg.TenantID},
		}
	}
	// TODO: loki with auth
	return httpclient.NewHTTPClient(cfg.Timeout, headers)
}

func GetFlows(cfg LokiConfig, allowExport bool) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(&cfg)

	// TODO: improve search mecanism:
	// - better way to make difference between labels and values
	// - don't always use regex (port number for example)
	// - manage range (check RANGE_SPLIT_CHAR on front side)
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		hlog.Debugf("GetFlows query params: %s", params)

		//allow export only on specific endpoints
		queryBuilder := loki.NewQuery(cfg.URL.String(), cfg.Labels, allowExport)
		if err := queryBuilder.AddParams(params); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		resp, code, err := executeFlowQuery(queryBuilder, lokiClient)
		if err != nil {
			writeError(w, code, "Loki query failed: "+err.Error())
			return
		}

		hlog.Tracef("GetFlows raw response: %s", resp)
		if allowExport {
			switch f := queryBuilder.ExportFormat(); f {
			case exportCSVFormat:
				writeCSV(w, http.StatusOK, resp, queryBuilder.ExportColumns())
			default:
				writeError(w, http.StatusServiceUnavailable,
					fmt.Sprintf("export format %q is not valid", f))
			}
		} else {
			writeRawJSON(w, http.StatusOK, resp)
		}
	}
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

func executeFlowQuery(queryBuilder *loki.Query, lokiClient httpclient.HTTPClient) ([]byte, int, error) {
	queryBuilder, err := queryBuilder.PrepareToSubmit()
	if err != nil {
		return nil, http.StatusBadRequest, err
	}

	flowsURL, err := queryBuilder.URLQuery()
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	return executeLokiQuery(flowsURL, lokiClient)
}

func executeLokiQuery(flowsURL string, lokiClient httpclient.HTTPClient) ([]byte, int, error) {
	hlog.Debugf("executeLokiQuery URL: %s", flowsURL)

	resp, code, err := lokiClient.Get(EncodeQuery(flowsURL))
	if err != nil {
		return nil, http.StatusServiceUnavailable, err
	}
	if code != http.StatusOK {
		msg := getLokiError(resp, code)
		return nil, http.StatusBadRequest, errors.New("Loki backend responded: " + msg)
	}
	return resp, http.StatusOK, nil
}
