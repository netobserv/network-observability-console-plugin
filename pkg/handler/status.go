package handler

import (
	"context"
	"net/http"
	"strings"
)

type Status struct {
	IsAllowProm         bool `yaml:"isAllowProm" json:"isAllowProm"`
	PromNamespacesCount int  `yaml:"promNamespacesCount" json:"promNamespacesCount"`
	IsAllowLoki         bool `yaml:"isAllowLoki" json:"isAllowLoki"`
	LokiNamespacesCount int  `yaml:"lokiNamespacesCount" json:"lokiNamespacesCount"`
	IsLokiReady         bool `yaml:"isLokiReady" json:"isLokiReady"`
	IsConsistent        bool `yaml:"isConsistent" json:"isConsistent"`
}

func (h *Handlers) Status(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		namespace := params.Get(namespaceKey)
		isDev := namespace != ""

		status := Status{
			IsAllowProm: h.Cfg.IsPromEnabled(),
			IsAllowLoki: h.Cfg.IsLokiEnabled(),
		}

		if status.IsAllowProm {
			promClients, err := newPromClients(h.Cfg, r.Header, namespace)
			if err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
			// get namespaces using Prom
			promNamespaces, code, err := h.getNamespacesValues(ctx, promClients, isDev)
			if err != nil {
				writeError(w, code, "Error while fetching label namespace values from Prometheus: "+err.Error())
				return
			}
			status.PromNamespacesCount = len(promNamespaces)
		}

		if status.IsAllowLoki {
			resp, code, err := h.getLokiStatus(r)
			if err != nil {
				writeError(w, code, err.Error())
				return
			}
			lokiStatus := string(resp)
			if strings.Contains(lokiStatus, "ready") {
				status.IsLokiReady = true
			} else {
				status.IsLokiReady = false
			}

			lokiClients := newLokiClients(h.Cfg, r.Header, false)
			// get namespaces using Loki
			lokiNamespaces, code, err := h.getNamespacesValues(ctx, lokiClients, isDev)
			if err != nil {
				writeError(w, code, "Error while fetching label namespace values from Loki: "+err.Error())
				return
			}
			status.LokiNamespacesCount = len(lokiNamespaces)
		}
		// consistent if both datasources are enabled and counts are equal
		if status.IsAllowLoki && status.IsAllowProm {
			status.IsConsistent = status.PromNamespacesCount == status.LokiNamespacesCount
		} else {
			status.IsConsistent = true
		}
		writeJSON(w, http.StatusOK, status)
	}
}
