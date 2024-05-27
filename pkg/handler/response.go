package handler

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	csvdata "github.com/netobserv/network-observability-console-plugin/pkg/handler/csv"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

const codePrometheusUnsupported = 901 // code to use internally to notify a Bad Request, unsupported for prometheus queries

func writeText(w http.ResponseWriter, code int, bytes []byte) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(code)
	_, err := w.Write(bytes)
	if err != nil {
		hlog.Errorf("Error while responding Text: %v", err)
	}
}

func writeJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		hlog.Errorf("Marshalling error while responding JSON: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err = w.Write(response)
	if err != nil {
		hlog.Errorf("Error while responding JSON: %v", err)
	}
}

func writeCSV(w http.ResponseWriter, code int, qr *model.AggregatedQueryResponse, columns []string) {
	data, err := csvdata.GetCSVData(qr, columns)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	hlog.Tracef("CSV data: %v", data)

	t := time.Now()
	// output file would be 'export-stdLongYear-stdZeroMonth-stdZeroDay-stdHour-stdZeroMinute.csv'
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=export-%s.csv", t.Format("2006-01-02-15-04")))
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Transfer-Encoding", "chunked")
	w.WriteHeader(code)
	writer := csv.NewWriter(w)
	for _, row := range data {
		// write csv row
		err := writer.Write(row)
		if err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("Cannot write row %s", row))
			return
		}
	}
	writer.Flush()
}

type errorResponse struct {
	Message         string `json:"message,omitempty"`
	PromUnsupported string `json:"promUnsupported,omitempty"`
}

func writeError(w http.ResponseWriter, code int, message string) {
	var resp errorResponse
	if code == codePrometheusUnsupported {
		code = http.StatusBadRequest
		resp = errorResponse{PromUnsupported: message}
	} else {
		resp = errorResponse{Message: message}
	}
	response, err := json.Marshal(resp)
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
