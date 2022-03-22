package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

func GetNamespaces(cfg LokiConfig) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(&cfg)
	return func(w http.ResponseWriter, r *http.Request) {
		// Fetch and merge values for SrcK8S_Namespace and DstK8S_Namespace
		values, code, err := getLabelValues(&cfg, lokiClient, fields.SrcNamespace)
		if err != nil {
			writeError(w, code, "Error while fetching label source namespace values from Loki: "+err.Error())
			return
		}

		values2, code, err := getLabelValues(&cfg, lokiClient, fields.DstNamespace)
		if err != nil {
			writeError(w, code, "Error while fetching label destination namespace values from Loki: "+err.Error())
			return
		}

		values = append(values, values2...)
		writeJSON(w, http.StatusOK, utils.NonEmpty(utils.Dedup(values)))
	}
}

func getLabelValues(cfg *LokiConfig, lokiClient httpclient.HTTPClient, label string) ([]string, int, error) {
	baseURL := strings.TrimRight(cfg.URL.String(), "/")
	url := fmt.Sprintf("%s/loki/api/v1/label/%s/values", baseURL, label)
	hlog.Debugf("getLabelValues URL: %s", url)

	resp, code, err := lokiClient.Get(url)
	if err != nil {
		return nil, http.StatusServiceUnavailable, err
	}
	if code != http.StatusOK {
		msg := getLokiError(resp, code)
		return nil, http.StatusBadRequest, errors.New(msg)
	}
	hlog.Tracef("GetFlows raw response: %s", resp)
	var lvr model.LabelValuesResponse
	err = json.Unmarshal(resp, &lvr)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	return lvr.Data, http.StatusOK, nil
}

func GetNames(cfg LokiConfig) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(&cfg)
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		namespace := params["namespace"]
		kind := params["kind"]

		names, code, err := getNamesForPrefix(cfg, lokiClient, fields.Src, kind, namespace)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}
		names2, code, err := getNamesForPrefix(cfg, lokiClient, fields.Dst, kind, namespace)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		names = append(names, names2...)
		writeJSON(w, http.StatusOK, utils.NonEmpty(utils.Dedup(names)))
	}
}

func getNamesForPrefix(cfg LokiConfig, lokiClient httpclient.HTTPClient, prefix, kind, namespace string) ([]string, int, error) {
	lokiParams := map[string][]string{
		prefix + fields.Namespace: {exact(namespace)},
	}
	var fieldToExtract string
	if utils.IsOwnerKind(kind) {
		lokiParams[prefix+fields.OwnerType] = []string{exact(kind)}
		fieldToExtract = prefix + fields.OwnerName
	} else {
		lokiParams[prefix+fields.Type] = []string{exact(kind)}
		fieldToExtract = prefix + fields.Name
	}

	queryBuilder := loki.NewQuery(cfg.URL.String(), cfg.Labels, false)
	if err := queryBuilder.AddParams(lokiParams); err != nil {
		return nil, http.StatusBadRequest, err
	}

	resp, code, err := executeFlowQuery(queryBuilder, lokiClient)
	if err != nil {
		return nil, code, errors.New("Loki query failed: " + err.Error())
	}
	hlog.Tracef("GetNames raw response: %s", resp)

	var qr model.QueryResponse
	err = json.Unmarshal(resp, &qr)
	if err != nil {
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
