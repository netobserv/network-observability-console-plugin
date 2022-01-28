package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
)

var hlog = logrus.WithField("module", "handler")

const startTimeKey = "startTime"
const endTimeTimeKey = "endTime"
const timeRangeKey = "timeRange"
const limitKey = "limit"
const queryParam = "?query="
const startParam = "&start="
const endParam = "&end="
const limitParam = "&limit="
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

func isNumeric(v string) bool {
	switch v {
	case
		"SrcPort",
		"DstPort",
		"Packets",
		"Proto",
		"Bytes",
		"FlowDirection":
		return true
	default:
		return false
	}
}

func isIPAddress(v string) bool {
	return v == "DstAddr" || v == "SrcAddr" || v == "DstHostIP" || v == "SrcHostIP"
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
		ipFilters := strings.Builder{}
		extraArgs := strings.Builder{}

		for key := range params {
			param := params.Get(key)
			err := processParam(key, param, &labelFilters, &lineFilters, &ipFilters, &extraArgs)
			if err != nil {
				writeError(w, http.StatusBadRequest, err.Error())
				return
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
		url.WriteString(ipFilters.String())
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
		hlog.Tracef("GetFlows raw response: %s", resp)
		writeRawJSON(w, http.StatusOK, resp)
	}
}

func processParam(key, value string, labelFilters, lineFilters, ipFilters, extraArgs *strings.Builder) error {
	var err error
	switch key {
	case startTimeKey:
		extraArgs.WriteString(startParam)
		extraArgs.WriteString(value)
	case endTimeTimeKey:
		extraArgs.WriteString(endParam)
		extraArgs.WriteString(value)
	case timeRangeKey:
		err = selectTimeRange(value, extraArgs)
	case limitKey:
		extraArgs.WriteString(limitParam)
		extraArgs.WriteString(value)
	default:
		values := strings.Split(value, ",")
		if isLabel(key) {
			processLabelFilters(key, values, labelFilters)
		} else if isIPAddress(key) {
			processIPFilters(key, values, ipFilters)
		} else {
			err = processLineFilters(key, values, lineFilters)
		}
	}
	return err
}

func processLabelFilters(key string, values []string, labelFilters *strings.Builder) {
	regexStr := strings.Builder{}
	for i, value := range values {
		if i > 0 {
			regexStr.WriteByte('|')
		}
		//match any caracter before / after value : .*VALUE.*
		regexStr.WriteString(".*")
		regexStr.WriteString(value)
		regexStr.WriteString(".*")
	}

	if regexStr.Len() > 0 {
		//label match regex : ,key=~REGEX_EXPRESSION
		labelFilters.WriteString(",")
		labelFilters.WriteString(key)
		labelFilters.WriteString(`=~"`)
		labelFilters.WriteString(regexStr.String())
		labelFilters.WriteString(`"`)
	}
}

// filterIPInLine assumes that we are searching for that IP addresses as part
// of the log line (not in the labels)
func processIPFilters(key string, values []string, ipFilters *strings.Builder) {
	for _, value := range values {
		if ipFilters.Len() == 0 {
			ipFilters.WriteString(`|json`)
		}
		ipFilters.WriteByte('|')
		ipFilters.WriteString(key)
		ipFilters.WriteString(`=ip("`)
		ipFilters.WriteString(value)
		ipFilters.WriteString(`")`)
	}
}

func processLineFilters(key string, values []string, lineFilters *strings.Builder) error {
	regexStr := strings.Builder{}
	for i, value := range values {
		if i > 0 {
			regexStr.WriteByte('|')
		}
		if strings.Contains(value, "`") {
			return errors.New("backquote not authorized in flows requests")
		}
		//match KEY + VALUE: "KEY":"[^\"]*VALUE" (ie: contains VALUE) or, if numeric, "KEY":VALUE
		regexStr.WriteString(`"`)
		regexStr.WriteString(key)
		regexStr.WriteString(`":`)
		if isNumeric(key) {
			regexStr.WriteString(value)
		} else {
			regexStr.WriteString(`"[^"]*`)
			regexStr.WriteString(value)
		}
	}

	if regexStr.Len() > 0 {
		//line match regex : |~"REGEX_EXPRESSION"
		lineFilters.WriteString("|~`")
		lineFilters.WriteString(regexStr.String())
		lineFilters.WriteString("`")
	}
	return nil
}

func selectTimeRange(param string, extraArgs *strings.Builder) error {
	r, err := strconv.ParseInt(param, 10, 64)
	if err != nil {
		return err
	}
	extraArgs.WriteString(startParam)
	extraArgs.WriteString(strconv.FormatInt(time.Now().Unix()-r, 10))
	return nil
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
