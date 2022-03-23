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

func writeRawJSON(w http.ResponseWriter, code int, payload []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err := w.Write(payload)
	if err != nil {
		hlog.Errorf("Error while responding raw JSON: %v", err)
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

func writeCSV(w http.ResponseWriter, code int, payload []byte, columns []string) {
	var qr model.QueryResponse
	err := json.Unmarshal(payload, &qr)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Unknown error from Loki - cannot unmarshal (code: %d resp: %s)", code, payload))
		return
	}

	datas, err := csvdata.GetCSVData(&qr, columns)
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
