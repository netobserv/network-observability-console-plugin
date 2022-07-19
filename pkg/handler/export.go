package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
)

const (
	exportCSVFormat  = "csv"
	exportFormatKey  = "format"
	exportcolumnsKey = "columns"
)

func ExportFlows(cfg *loki.Config) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(cfg)

	return func(w http.ResponseWriter, r *http.Request) {
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("ExportFlows", code, startTime)
		}()

		params := r.URL.Query()
		hlog.Debugf("ExportFlows query params: %s", params)

		flows, code, err := getFlows(cfg, lokiClient, params)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		exportFormat := params.Get(exportFormatKey)
		var exportColumns []string
		if str := params.Get(exportcolumnsKey); len(str) > 0 {
			exportColumns = strings.Split(str, ",")
		}

		switch exportFormat {
		case exportCSVFormat:
			code = http.StatusOK
			writeCSV(w, code, flows, exportColumns)
		default:
			code = http.StatusBadRequest
			writeError(w, code, fmt.Sprintf("export format %q is not valid", exportFormat))
		}
	}
}
