package server

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
)

func setupRoutes(cfg *Config) *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/api/status", handler.Status)
	r.HandleFunc("/api/loki/status/ready", handler.LokiReady(&cfg.Loki))
	r.HandleFunc("/api/loki/status/metrics", handler.LokiMetrics(&cfg.Loki))
	r.HandleFunc("/api/loki/buildinfo", handler.LokiBuildInfos(&cfg.Loki))
	r.HandleFunc("/api/loki/config/limits", handler.LokiConfig(&cfg.Loki, "limits_config"))
	r.HandleFunc("/api/loki/flows", handler.GetFlows(&cfg.Loki))
	r.HandleFunc("/api/loki/export", handler.ExportFlows(&cfg.Loki))
	r.HandleFunc("/api/loki/metrics", handler.GetMetrics(&cfg.Loki))
	r.HandleFunc("/api/resources/namespaces", handler.GetNamespaces(&cfg.Loki))
	r.HandleFunc("/api/resources/namespace/{namespace}/kind/{kind}/names", handler.GetNames(&cfg.Loki))
	r.HandleFunc("/api/resources/kind/{kind}/names", handler.GetNames(&cfg.Loki))
	r.HandleFunc("/api/frontend-config", handler.GetConfig(cfg.FrontendConfig))
	r.Handle("/metrics", promhttp.Handler())
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/dist/")))
	return r
}
