package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/prometheus"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

func (h *Handlers) GetClusters(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		clients, err := newClients(h.Cfg, r.Header, false)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetClusters", code, startTime)
		}()

		// Fetch and merge values for K8S_ClusterName
		values, code, err := h.getLabelValues(ctx, clients, fields.Cluster)
		if err != nil {
			writeError(w, code, "Error while fetching label cluster values from Loki: "+err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func (h *Handlers) GetZones(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		clients, err := newClients(h.Cfg, r.Header, false)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetZones", code, startTime)
		}()

		// Initialize values explicitly to avoid null json when empty
		values := []string{}

		// Fetch and merge values for SrcK8S_Zone and DstK8S_Zone
		values1, code, err := h.getLabelValues(ctx, clients, fields.SrcZone)
		if err != nil {
			writeError(w, code, "Error while fetching label source zone values from Loki: "+err.Error())
			return
		}
		values = append(values, values1...)

		values2, code, err := h.getLabelValues(ctx, clients, fields.DstZone)
		if err != nil {
			writeError(w, code, "Error while fetching label destination zone values from Loki: "+err.Error())
			return
		}
		values = append(values, values2...)

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func (h *Handlers) GetNamespaces(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		clients, err := newClients(h.Cfg, r.Header, false)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetNamespaces", code, startTime)
		}()

		// Initialize values explicitly to avoid null json when empty
		values := []string{}

		// Fetch and merge values for SrcK8S_Namespace and DstK8S_Namespace
		values1, code, err := h.getLabelValues(ctx, clients, fields.SrcNamespace)
		if err != nil {
			writeError(w, code, "Error while fetching label source namespace values from Loki: "+err.Error())
			return
		}
		values = append(values, values1...)

		values2, code, err := h.getLabelValues(ctx, clients, fields.DstNamespace)
		if err != nil {
			writeError(w, code, "Error while fetching label destination namespace values from Loki: "+err.Error())
			return
		}
		values = append(values, values2...)

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func (h *Handlers) getLabelValues(ctx context.Context, cl clients, label string) ([]string, int, error) {
	if h.Cfg.IsPromEnabled() {
		return prometheus.GetLabelValues(ctx, cl.prom, label)
	}
	return getLokiLabelValues(h.Cfg.Loki.URL, cl.loki, label)
}

func (h *Handlers) GetNames(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		clients, err := newClients(h.Cfg, r.Header, false)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetNames", code, startTime)
		}()
		params := mux.Vars(r)
		namespace := params["namespace"]
		kind := params["kind"]

		// Initialize names explicitly to avoid null json when empty
		names := []string{}

		// TODO: parallelize
		names1, code, err := h.getNamesForPrefix(ctx, clients, fields.Src, kind, namespace)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}
		names = append(names, names1...)

		names2, code, err := h.getNamesForPrefix(ctx, clients, fields.Dst, kind, namespace)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}
		names = append(names, names2...)

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(names)))
	}
}

func (h *Handlers) getNamesForPrefix(ctx context.Context, cl clients, prefix, kind, namespace string) ([]string, int, error) {
	if h.Cfg.IsPromEnabled() {
		// TODO: implement for prom
		return []string{}, http.StatusOK, nil
	}
	return getLokiNamesForPrefix(&h.Cfg.Loki, cl.loki, prefix, kind, namespace)
}

func exact(str string) string {
	return `"` + str + `"`
}

func extractDistinctValues(field string, streams model.Streams) []string {
	var values []string
	for _, stream := range streams {
		if v, ok := stream.Labels[field]; ok {
			if len(v) > 0 {
				values = append(values, v)
			}
		} else {
			for _, entry := range stream.Entries {
				var line map[string]interface{}
				err := json.Unmarshal([]byte(entry.Line), &line)
				if err != nil {
					hlog.Errorf("Could not unmarshal line: %v. Error was: %v", entry.Line, err.Error())
					continue
				}
				if v, ok := line[field]; ok {
					if str, ok := v.(string); ok && len(str) > 0 {
						values = append(values, str)
					}
				}
			}
		}
	}
	return utils.Dedup(values)
}
