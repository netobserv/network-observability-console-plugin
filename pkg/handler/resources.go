package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

func GetClusters(cfg *config.Loki) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header, false)
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetClusters", code, startTime)
		}()

		// Fetch and merge values for K8S_ClusterName
		values, code, err := getLabelValues(cfg, lokiClient, fields.Cluster)
		if err != nil {
			writeError(w, code, "Error while fetching label cluster values from Loki: "+err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func GetZones(cfg *config.Loki) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header, false)
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetZones", code, startTime)
		}()

		// Initialize values explicitly to avoid null json when empty
		values := []string{}

		// Fetch and merge values for SrcK8S_Zone and DstK8S_Zone
		values1, code, err := getLabelValues(cfg, lokiClient, fields.SrcZone)
		if err != nil {
			writeError(w, code, "Error while fetching label source zone values from Loki: "+err.Error())
			return
		}
		values = append(values, values1...)

		values2, code, err := getLabelValues(cfg, lokiClient, fields.DstZone)
		if err != nil {
			writeError(w, code, "Error while fetching label destination zone values from Loki: "+err.Error())
			return
		}
		values = append(values, values2...)

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func GetNamespaces(cfg *config.Loki) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header, false)
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetNamespaces", code, startTime)
		}()

		// Initialize values explicitly to avoid null json when empty
		values := []string{}

		// Fetch and merge values for SrcK8S_Namespace and DstK8S_Namespace
		values1, code, err := getLabelValues(cfg, lokiClient, fields.SrcNamespace)
		if err != nil {
			writeError(w, code, "Error while fetching label source namespace values from Loki: "+err.Error())
			return
		}
		values = append(values, values1...)

		values2, code, err := getLabelValues(cfg, lokiClient, fields.DstNamespace)
		if err != nil {
			writeError(w, code, "Error while fetching label destination namespace values from Loki: "+err.Error())
			return
		}
		values = append(values, values2...)

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(values)))
	}
}

func getLabelValues(cfg *config.Loki, lokiClient httpclient.Caller, label string) ([]string, int, error) {
	baseURL := strings.TrimRight(cfg.URL, "/")
	url := fmt.Sprintf("%s/loki/api/v1/label/%s/values", baseURL, label)
	hlog.Debugf("getLabelValues URL: %s", url)

	resp, code, err := lokiClient.Get(url)
	if err != nil {
		return nil, http.StatusServiceUnavailable, err
	}
	if code != http.StatusOK {
		newCode, msg := getLokiError(resp, code)
		return nil, newCode, errors.New(msg)
	}
	hlog.Tracef("GetFlows raw response: %s", resp)
	var lvr model.LabelValuesResponse
	err = json.Unmarshal(resp, &lvr)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	return lvr.Data, http.StatusOK, nil
}

func GetNames(cfg *config.Loki) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header, false)
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
		names1, code, err := getNamesForPrefix(cfg, lokiClient, fields.Src, kind, namespace)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}
		names = append(names, names1...)

		names2, code, err := getNamesForPrefix(cfg, lokiClient, fields.Dst, kind, namespace)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}
		names = append(names, names2...)

		code = http.StatusOK
		writeJSON(w, code, utils.NonEmpty(utils.Dedup(names)))
	}
}

func getNamesForPrefix(cfg *config.Loki, lokiClient httpclient.Caller, prefix, kind, namespace string) ([]string, int, error) {
	lokiParams := filters.SingleQuery{}
	if namespace != "" {
		lokiParams = append(lokiParams, filters.NewMatch(prefix+fields.Namespace, exact(namespace)))
	}
	var fieldToExtract string
	if utils.IsOwnerKind(kind) {
		lokiParams = append(lokiParams, filters.NewMatch(prefix+fields.OwnerType, exact(kind)))
		fieldToExtract = prefix + fields.OwnerName
	} else {
		lokiParams = append(lokiParams, filters.NewMatch(prefix+fields.Type, exact(kind)))
		fieldToExtract = prefix + fields.Name
	}

	queryBuilder := loki.NewFlowQueryBuilderWithDefaults(cfg)
	if err := queryBuilder.Filters(lokiParams); err != nil {
		return nil, http.StatusBadRequest, err
	}

	query := queryBuilder.Build()
	resp, code, err := executeLokiQuery(query, lokiClient)
	if err != nil {
		return nil, code, errors.New("Loki query failed: " + err.Error())
	}
	hlog.Tracef("GetNames raw response: %s", resp)

	var qr model.QueryResponse
	err = json.Unmarshal(resp, &qr)
	if err != nil {
		hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
		return nil, http.StatusInternalServerError, errors.New("Failed to unmarshal Loki response: " + err.Error())
	}

	streams, ok := qr.Data.Result.(model.Streams)
	if !ok {
		return nil, http.StatusInternalServerError, errors.New("Loki returned unexpected type: " + string(qr.Data.ResultType))
	}

	values := extractDistinctValues(fieldToExtract, streams)
	return values, http.StatusOK, nil
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
