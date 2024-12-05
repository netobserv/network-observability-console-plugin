package handler

import (
	"context"
	"net/http"
	"strings"
)

type Status struct {
	Loki       DatasourceStatus `yaml:"loki" json:"loki"`
	Prometheus DatasourceStatus `yaml:"prometheus" json:"prometheus"`
}

type DatasourceStatus struct {
	IsEnabled       bool   `yaml:"isEnabled" json:"isEnabled"`
	NamespacesCount int    `yaml:"namespacesCount" json:"namespacesCount"`
	IsReady         bool   `yaml:"isReady" json:"isReady"`
	Error           string `yaml:"error" json:"error"`
	ErrorCode       int    `yaml:"errorCode" json:"errorCode"`
}

func (h *Handlers) Status(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		namespace := params.Get(namespaceKey)
		isDev := namespace != ""

		status := Status{
			Prometheus: DatasourceStatus{IsEnabled: h.Cfg.IsPromEnabled()},
			Loki:       DatasourceStatus{IsEnabled: h.Cfg.IsLokiEnabled()},
		}

		if status.Prometheus.IsEnabled {
			promClients, err := newPromClients(h.Cfg, r.Header, namespace)
			if err != nil {
				status.Prometheus.Error = err.Error()
				status.Prometheus.ErrorCode = http.StatusInternalServerError
			} else {
				// Get namespaces using Prom
				promNamespaces, code, err := h.getNamespacesValues(ctx, promClients, isDev)
				if err != nil {
					status.Prometheus.Error = "Error while fetching label namespace values from Prometheus: " + err.Error()
					status.Prometheus.ErrorCode = code
				} else {
					status.Prometheus.IsReady = true
					status.Prometheus.NamespacesCount = len(promNamespaces)
				}
			}
		}

		if status.Loki.IsEnabled {
			resp, code, err := h.getLokiStatus(r)
			if err != nil {
				status.Loki.Error = err.Error()
				status.Loki.ErrorCode = code
			} else {
				lokiStatus := string(resp)
				status.Loki.IsReady = strings.Contains(lokiStatus, "ready")

				lokiClients := newLokiClients(h.Cfg, r.Header, false)
				// get namespaces using Loki
				lokiNamespaces, code, err := h.getNamespacesValues(ctx, lokiClients, isDev)
				if err != nil {
					status.Loki.Error = "Error while fetching label namespace values from Loki: " + err.Error()
					status.Loki.ErrorCode = code
				} else {
					status.Loki.NamespacesCount = len(lokiNamespaces)
				}
			}
		}
		writeJSON(w, http.StatusOK, status)
	}
}
