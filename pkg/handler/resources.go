package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/prometheus"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

func (h *Handlers) GetClusters(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		namespace := params.Get(namespaceKey)
		isDev := namespace != ""

		clients, err := newClients(h.Cfg, r.Header, false, namespace)
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
		values, code, err := h.getLabelValues(ctx, clients, fields.Cluster, isDev)
		if err != nil {
			writeError(w, code, "Error while fetching label cluster values: "+err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func (h *Handlers) GetZones(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		namespace := params.Get(namespaceKey)
		isDev := namespace != ""

		clients, err := newClients(h.Cfg, r.Header, false, namespace)
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
		values1, code, err := h.getLabelValues(ctx, clients, fields.SrcZone, isDev)
		if err != nil {
			writeError(w, code, "Error while fetching label source zone values: "+err.Error())
			return
		}
		values = append(values, values1...)

		values2, code, err := h.getLabelValues(ctx, clients, fields.DstZone, isDev)
		if err != nil {
			writeError(w, code, "Error while fetching label destination zone values: "+err.Error())
			return
		}
		values = append(values, values2...)

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func (h *Handlers) getNamespacesValues(ctx context.Context, clients clients, isDev bool) ([]string, int, error) {
	// Initialize values explicitly to avoid null json when empty
	values := []string{}

	// Fetch and merge values for SrcK8S_Namespace and DstK8S_Namespace
	values1, code, err := h.getLabelValues(ctx, clients, fields.SrcNamespace, isDev)
	if err != nil {
		return []string{}, code, err
	}
	values = append(values, values1...)

	values2, code, err := h.getLabelValues(ctx, clients, fields.DstNamespace, isDev)
	if err != nil {
		return []string{}, code, err
	}
	values = append(values, values2...)

	return values, http.StatusOK, nil
}

func (h *Handlers) GetNamespaces(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		namespace := params.Get(namespaceKey)
		isDev := namespace != ""

		clients, err := newClients(h.Cfg, r.Header, false, namespace)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetNamespaces", code, startTime)
		}()

		values, code, err := h.getNamespacesValues(ctx, clients, isDev)
		if err != nil {
			writeError(w, code, "Error while fetching label namespace values: "+err.Error())
			return
		}
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func (h *Handlers) getLabelValues(ctx context.Context, cl clients, label string, isDev bool) ([]string, int, error) {
	if h.PromInventory != nil && h.PromInventory.LabelExists(label) {
		client := cl.getPromClient(isDev)
		if client != nil {
			return prometheus.GetLabelValues(ctx, client, label, nil)
		}
	}
	if cl.loki != nil {
		return getLokiLabelValues(h.Cfg.Loki.URL, cl.loki, label)
	}
	// Loki disabled AND label not managed in metrics => send an error
	return nil, http.StatusBadRequest, fmt.Errorf("label %s not found in Prometheus metrics", label)
}

func (h *Handlers) GetNames(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		namespace := params.Get(namespaceKey)
		kind := params.Get("kind")

		clients, err := newClients(h.Cfg, r.Header, false, namespace)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetNames", code, startTime)
		}()

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
	filts := filters.SingleQuery{}
	if namespace != "" {
		filts = append(filts, filters.NewMatch(prefix+fields.Namespace, exact(namespace)))
	}
	var searchField string
	if utils.IsOwnerKind(kind) {
		filts = append(filts, filters.NewMatch(prefix+fields.OwnerType, exact(kind)))
		searchField = prefix + fields.OwnerName
	} else {
		filts = append(filts, filters.NewMatch(prefix+fields.Type, exact(kind)))
		searchField = prefix + fields.Name
	}

	if h.Cfg.IsPromEnabled() {
		// Label match query (any metric)
		q := prometheus.QueryFilters("", filts)
		return prometheus.GetLabelValues(ctx, cl.promAdmin, searchField, []string{q})
	}
	return getLokiNamesForPrefix(&h.Cfg.Loki, cl.loki, filts, searchField)
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
