package handler

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/loki/pkg/loghttp"
	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/sirupsen/logrus"
)

var hlog = logrus.WithField("module", "handler")

const timestampCol = "Timestamp"
const csvKey = "csv"
const columnsKey = "columns"
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

type Format struct {
	csv     bool
	columns *[]string
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
		format := Format{csv: false}

		for key := range params {
			param := params.Get(key)
			err := processParam(key, param, &labelFilters, &lineFilters, &ipFilters, &extraArgs, &format)
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
		if format.csv {
			writeCSV(w, http.StatusOK, resp, format.columns)
		} else {
			writeRawJSON(w, http.StatusOK, resp)
		}
	}
}

func processParam(key, value string, labelFilters, lineFilters, ipFilters, extraArgs *strings.Builder, format *Format) error {
	var err error
	switch key {
	case csvKey:
		b, _ := strconv.ParseBool(value)
		format.csv = b
	case columnsKey:
		values := strings.Split(value, ",")
		format.columns = &values
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

func writeCSV(w http.ResponseWriter, code int, payload []byte, columns *[]string) {
	var qr loghttp.QueryResponse
	err := json.Unmarshal(payload, &qr)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, fmt.Sprintf("Unknown error from Loki - cannot unmarshal (code: %d resp: %s)", code, payload))
		return
	}

	datas, err := getCSVDatas(&qr, columns)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename=export.csv")
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Transfer-Encoding", "chunked")
	w.WriteHeader(code)
	writer := csv.NewWriter(w)
	for _, row := range datas {
		//write csv row
		err := writer.Write(row)
		if err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("Cannot write row %s", row))
			return
		}
	}
	writer.Flush()
}

func getCSVDatas(qr *loghttp.QueryResponse, columns *[]string) ([][]string, error) {
	if columns != nil && len(*columns) == 0 {
		return nil, fmt.Errorf("columns can't be empty if specified")
	}

	//reflect loghttp result from grafana lib
	cap := reflect.ValueOf(qr.Data.Result).Cap()
	streams := reflect.ValueOf(qr.Data.Result).Slice(0, cap).Interface().(loghttp.Streams)

	return manageStreams(streams, columns)
}

func manageStreams(streams loghttp.Streams, columns *[]string) ([][]string, error) {
	//make csv datas containing header as first line + rows
	datas := make([][]string, 1)
	//set Timestamp as first data
	if columns == nil || contains(*columns, timestampCol) {
		datas[0] = append(datas[0], timestampCol)
	}
	//keep ordered labels / field names between each lines
	//filtered by columns parameter if specified
	var labels []string
	var fields []string
	for _, stream := range streams {
		//get labels from first stream
		if labels == nil {
			labels = make([]string, 0, len(stream.Labels))
			for name := range stream.Labels {
				if columns == nil || contains(*columns, name) {
					labels = append(fields, name)
				}
			}
			datas[0] = append(datas[0], labels...)
		}

		//apply timestamp & labels for each entries and add json line fields
		for _, entry := range stream.Entries {
			//get json line
			var line map[string]interface{}
			err := json.Unmarshal([]byte(entry.Line), &line)
			if err != nil {
				return nil, fmt.Errorf("cannot unmarshal line %s", entry.Line)
			}

			//get fields from first line
			if fields == nil {
				fields = make([]string, 0, len(line))
				for name := range line {
					if columns == nil || contains(*columns, name) {
						fields = append(fields, name)
					}
				}
				datas[0] = append(datas[0], fields...)
			}

			datas = append(datas, getRowDatas(stream, entry, labels, fields, line, len(datas[0]), columns))
		}
	}
	return datas, nil
}

func getRowDatas(stream loghttp.Stream, entry loghttp.Entry, labels []string, fields []string,
	line map[string]interface{}, size int, columns *[]string) []string {
	index := 0
	rowDatas := make([]string, size)

	//set timestamp
	if columns == nil || contains(*columns, timestampCol) {
		rowDatas[index] = entry.Timestamp.String()
	}

	//set labels values
	for _, label := range labels {
		index++
		rowDatas[index] = stream.Labels[label]
	}

	//set field values
	for _, field := range fields {
		index++
		rowDatas[index] = fmt.Sprintf("%v", line[field])
	}

	return rowDatas
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

func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}
