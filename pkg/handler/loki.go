package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/sirupsen/logrus"
)

var hlog = logrus.WithField("module", "handler")

const dateRangeDelimiter = "<"
const queryParam = "?query="
const startParam = "&start="
const endParam = "&end="
const lokiOrgIDHeader = "X-Scope-OrgID"
const getFlowsURLPath = "/loki/api/v1/query_range"

type LokiConfig struct {
	URL      *url.URL
	Timeout  time.Duration
	TenantID string
}

func isLabel(v string) bool {
	switch v {
	case
		"SrcNamespace",
		"SrcWorkload",
		"DstNamespace",
		"DstWorkload":
		return true
	default:
		return false
	}
}

func GetFlows(cfg LokiConfig) func(w http.ResponseWriter, r *http.Request) {
	flowsURL := strings.TrimRight(cfg.URL.String(), "/") + getFlowsURLPath

	var headers map[string][]string
	if cfg.TenantID != "" {
		headers = map[string][]string{
			lokiOrgIDHeader: {cfg.TenantID},
		}
	}
	// TODO: loki with auth
	lokiClient := httpclient.NewHTTPClient(cfg.Timeout, headers)

	// TODO: improve search mecanism:
	// - better way to make difference between labels and values
	// - don't always use regex (port number for example)
	// - manage range (check RANGE_SPLIT_CHAR on front side)
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		// TODO: remove all logs
		hlog.Infof("GetFlows query params : %s", params)
		labelFilters := "app=\"netobserv-flowcollector\""
		lineFilters := ""
		extraArgs := ""

		for key := range params {
			var regexStr = ""
			for _, value := range strings.Split(params.Get(key), ",") {
				if strings.Contains(value, dateRangeDelimiter) {
					var rangeValues = strings.Split(value, dateRangeDelimiter)
					//add start param if specified
					if len(rangeValues[0]) > 0 {
						extraArgs += fmt.Sprintf("%s%s", startParam, rangeValues[0])
					}
					//add end param if specified
					if len(rangeValues[1]) > 0 {
						extraArgs += fmt.Sprintf("%s%s", endParam, rangeValues[1])
					}
				} else {
					if len(regexStr) > 0 {
						regexStr += "|"
					}
					if isLabel(key) {
						//match any caracter before / after value
						regexStr += fmt.Sprintf(".*%s.*", value)
					} else {
						//match KEY containing VALUE \\"KEY\\":[\\"]{0,1}[^,]{0,}VALUE
						regexStr += fmt.Sprintf("\\\"%s\\\":[\\\"]{0,1}[^,]{0,}%s", key, value)
					}
				}
			}

			if len(regexStr) > 0 {
				if isLabel(key) {
					labelFilters += fmt.Sprintf(",%s=~\"%s\"", key, regexStr)
				} else {
					lineFilters += fmt.Sprintf("|~\"%s\"", regexStr)
				}
			}
		}

		url := fmt.Sprintf("%s%s{%s}%s%s", flowsURL, queryParam, labelFilters, lineFilters, extraArgs)
		hlog.Infof("GetFlows URL : %s", url)

		resp, code, err := lokiClient.Get(url)
		if err != nil {
			writeError(w, http.StatusServiceUnavailable, err.Error())
			return
		}
		if code != http.StatusOK {
			msg := getLokiError(resp, code)
			writeError(w, http.StatusServiceUnavailable, msg)
			return
		}
		hlog.Infof("GetFlows raw response: %v", string(resp))
		writeRawJSON(w, http.StatusOK, resp)
	}
}

func getLokiError(resp []byte, code int) string {
	var f map[string]string
	err := json.Unmarshal(resp, &f)
	if err != nil {
		return fmt.Sprintf("Unknown error from Loki - cannot unmarshal (code: %d)", code)
	}
	message, ok := f["message"]
	if !ok {
		return fmt.Sprintf("Unknown error from Loki - no message found (code: %d)", code)
	}
	return fmt.Sprintf("Error from Loki (code: %d): %s", code, message)
}

func writeRawJSON(w http.ResponseWriter, code int, payload []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err := w.Write(payload)
	if err != nil {
		hlog.Errorf("Error while responding raw JSON: %v", err)
	}
}

type errorResponse struct{ Message string }

func writeError(w http.ResponseWriter, code int, message string) {
	response, err := json.Marshal(errorResponse{Message: message})
	if err != nil {
		hlog.Errorf("Marshalling error while responding an error: %v (message was: %s)", err, message)
		code = http.StatusInternalServerError
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err = w.Write(response)
	if err != nil {
		hlog.Errorf("Error while responding an error: %v (message was: %s)", err, message)
	}
}
