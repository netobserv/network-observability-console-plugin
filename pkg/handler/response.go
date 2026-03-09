package handler

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler/apierrors"
	csvdata "github.com/netobserv/network-observability-console-plugin/pkg/handler/csv"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

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
		apierrors.Write(w, http.StatusInternalServerError, err)
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
		apierrors.Write(w, http.StatusInternalServerError, err)
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
			apierrors.Write(w, http.StatusInternalServerError, fmt.Errorf("cannot write row %s", row))
			return
		}
	}
	writer.Flush()
}
