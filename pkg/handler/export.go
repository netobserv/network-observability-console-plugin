package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
)

const (
	exportCSVFormat  = "csv"
	exportFormatKey  = "format"
	exportcolumnsKey = "columns"
)

func ExportFlows(cfg loki.Config) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(&cfg)

	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()

		flows, code, err := getFlows(cfg, lokiClient, params)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		exportFormat := params.Get(exportFormatKey)
		exportColumns := strings.Split(params.Get(exportcolumnsKey), ",")

		switch exportFormat {
		case exportCSVFormat:
			writeCSV(w, http.StatusOK, flows, exportColumns)
		default:
			writeError(w, http.StatusBadRequest, fmt.Sprintf("export format %q is not valid", exportFormat))
		}
	}
}
