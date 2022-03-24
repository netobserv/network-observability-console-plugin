package handler

import (
	"net/http"

	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
)

func GetTopology(cfg LokiConfig) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(&cfg)

	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		hlog.Debugf("GetTopology query params: %s", params)

		queryBuilder := loki.NewTopologyQuery(cfg.URL.String(), cfg.Labels)
		if err := queryBuilder.AddParams(params); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		queryBuilder, err := queryBuilder.PrepareToSubmit()
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		flowsURL, err := queryBuilder.URLQuery()
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		resp, code, err := executeLokiQuery(flowsURL, lokiClient)
		if err != nil {
			writeError(w, code, "Loki query failed: "+err.Error())
			return
		}

		hlog.Tracef("GetFlows raw response: %s", resp)
		writeRawJSON(w, http.StatusOK, resp)
	}
}
