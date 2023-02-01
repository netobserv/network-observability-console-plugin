package server

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
	"github.com/netobserv/network-observability-console-plugin/pkg/handler/auth"
)

func setupRoutes(cfg *Config, authChecker auth.Checker) *mux.Router {
	r := mux.NewRouter()
	r.Use(func(orig http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if err := authChecker.CheckAuth(context.TODO(), r.Header); err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				_, err2 := w.Write([]byte(err.Error()))
				if err2 != nil {
					logrus.Errorf("Error while responding an error: %v (initial was: %v)", err2, err)
				}
				return
			}
			orig.ServeHTTP(w, r)
		})
	})
	r.HandleFunc("/api/status", handler.Status)
	r.HandleFunc("/api/loki/ready", handler.LokiReady(&cfg.Loki))
	r.HandleFunc("/api/loki/metrics", handler.LokiMetrics(&cfg.Loki))
	r.HandleFunc("/api/loki/buildinfo", handler.LokiBuildInfos(&cfg.Loki))
	r.HandleFunc("/api/loki/config/limits", handler.LokiConfig(&cfg.Loki, "limits_config"))
	r.HandleFunc("/api/loki/flows", handler.GetFlows(&cfg.Loki))
	r.HandleFunc("/api/loki/export", handler.ExportFlows(&cfg.Loki))
	r.HandleFunc("/api/loki/topology", handler.GetTopology(&cfg.Loki))
	r.HandleFunc("/api/resources/namespaces", handler.GetNamespaces(&cfg.Loki))
	r.HandleFunc("/api/resources/namespace/{namespace}/kind/{kind}/names", handler.GetNames(&cfg.Loki))
	r.HandleFunc("/api/resources/kind/{kind}/names", handler.GetNames(&cfg.Loki))
	r.HandleFunc("/api/frontend-config", handler.GetConfig(cfg.FrontendConfig))
	r.Handle("/metrics", promhttp.Handler())
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/dist/")))
	return r
}
