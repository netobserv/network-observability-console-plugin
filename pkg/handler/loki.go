package handler

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

var hlog = logrus.WithField("module", "handler")

const (
	timestampCol    = "Timestamp"
	exportCSVFormat = "csv"
	lokiOrgIDHeader = "X-Scope-OrgID"
	getFlowsURLPath = "/loki/api/v1/query_range"
)

type LokiConfig struct {
	URL      *url.URL
	Timeout  time.Duration
	TenantID string
	Labels   []string
}

func GetFlows(cfg LokiConfig, allowExport bool) func(w http.ResponseWriter, r *http.Request) {
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

		//allow export only on specific endpoints
		queryBuilder := loki.NewQuery(cfg.Labels, allowExport)
		for key, param := range params {
			var val string
			if len(param) > 0 {
				val = param[0]
			}

			if len(val) > 0 {
				if err := queryBuilder.AddParam(key, val); err != nil {
					writeError(w, http.StatusBadRequest, err.Error())
					return
				}
			}
		}
		queryBuilder, err := queryBuilder.PrepareToSubmit()
		if err != nil {
			writeError(w, http.StatusBadRequest, "can't build loki query:"+err.Error())
		}

		//build get flows url
		query, err := queryBuilder.URLQuery()
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		flowsURL := strings.TrimRight(cfg.URL.String(), "/") + getFlowsURLPath + "?" + query
		hlog.Infof("GetFlows URL: %s", flowsURL)

		resp, code, err := lokiClient.Get(flowsURL)
		if err != nil {
			writeError(w, http.StatusServiceUnavailable, "Loki backend responded: "+err.Error())
			return
		}
		if code != http.StatusOK {
			msg := getLokiError(resp, code)
			writeError(w, http.StatusBadRequest, "Loki backend responded: "+msg)
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

func writeCSV(w http.ResponseWriter, code int, payload []byte, columns []string) {
	var qr model.QueryResponse
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

	t := time.Now()
	//output file would be 'export-stdLongYear-stdZeroMonth-stdZeroDay-stdHour-stdZeroMinute.csv'
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=export-%s.csv", t.Format("2006-01-02-15-04")))
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

func getCSVDatas(qr *model.QueryResponse, columns []string) ([][]string, error) {
	if columns != nil && len(columns) == 0 {
		return nil, fmt.Errorf("columns can't be empty if specified")
	}

	if streams, ok := qr.Data.Result.(model.Streams); ok {
		return manageStreams(streams, columns)
	}
	return nil, fmt.Errorf("loki returned an unexpected type: %T", qr.Data.Result)
}

func manageStreams(streams model.Streams, columns []string) ([][]string, error) {
	//make csv datas containing header as first line + rows
	datas := make([][]string, 1)
	//set Timestamp as first data
	if columns == nil || utils.Contains(columns, timestampCol) {
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
				if columns == nil || utils.Contains(columns, name) {
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
					if columns == nil || utils.Contains(columns, name) {
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

func getRowDatas(stream model.Stream, entry model.Entry, labels []string, fields []string,
	line map[string]interface{}, size int, columns []string) []string {
	index := 0
	rowDatas := make([]string, size)

	//set timestamp
	if columns == nil || utils.Contains(columns, timestampCol) {
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
