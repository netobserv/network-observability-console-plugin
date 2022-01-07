package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/sirupsen/logrus"
)

var hlog = logrus.WithField("module", "handler")

const startTimeKey = "startTime"
const endTimeTimeKey = "endTime"
const timeRangeKey = "timeRange"
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
		labelFilters := strings.Builder{}
		//always filter on app
		labelFilters.WriteString("app=\"netobserv-flowcollector\"")
		lineFilters := strings.Builder{}
		extraArgs := strings.Builder{}

		for key := range params {
			regexStr := strings.Builder{}

			param := params.Get(key)
			//add start / end param if specified
			switch key {
			case startTimeKey:
				extraArgs.WriteString(startParam)
				extraArgs.WriteString(param)
			case endTimeTimeKey:
				extraArgs.WriteString(endParam)
				extraArgs.WriteString(param)
			case timeRangeKey:
				r, err := strconv.ParseInt(param, 10, 64)
				if err != nil {
					writeError(w, http.StatusServiceUnavailable, err.Error())
				} else {
					extraArgs.WriteString(startParam)
					extraArgs.WriteString(strconv.FormatInt(time.Now().Unix()-r, 10))
				}
			default:
				for _, value := range strings.Split(param, ",") {
					if len(regexStr.String()) > 0 {
						regexStr.WriteByte('|')
					}
					if isLabel(key) {
						//match any caracter before / after value : .*VALUE.*
						regexStr.WriteString(".*")
						regexStr.WriteString(value)
						regexStr.WriteString(".*")
					} else {
						//match KEY containing VALUE : "KEY":["]{0,1}[^,]{0,}VALUE
						regexStr.WriteString("\\\"")
						regexStr.WriteString(key)
						regexStr.WriteString("\\\":[\\\"]{0,1}[^,]{0,}")
						regexStr.WriteString(value)
					}
				}

				if isLabel(key) {
					//label match regex : ,key=~REGEX_EXPRESSION
					labelFilters.WriteString(",")
					labelFilters.WriteString(key)
					labelFilters.WriteString("=~\"")
					labelFilters.WriteString(regexStr.String())
					labelFilters.WriteString("\"")
				} else {
					//line match regex : |~"REGEX_EXPRESSION"
					lineFilters.WriteString("|~\"")
					lineFilters.WriteString(regexStr.String())
					lineFilters.WriteString("\"")
				}
			}
		}

		//build final url
		url := strings.Builder{}
		url.WriteString(flowsURL)
		url.WriteString(queryParam)
		url.WriteRune('{')
		url.WriteString(labelFilters.String())
		url.WriteRune('}')
		url.WriteString(lineFilters.String())
		url.WriteString(extraArgs.String())
		hlog.Infof("GetFlows URL : %s", url.String())

		resp, code, err := lokiClient.Get(url.String())
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
		return fmt.Sprintf("Unknown error from Loki - cannot unmarshal (code: %d resp: %s)", code, resp)
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
