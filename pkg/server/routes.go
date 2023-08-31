package server

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
)

func setupRoutes(cfg *Config, authChecker auth.Checker) *mux.Router {
	r := mux.NewRouter()

	api := r.PathPrefix("/api").Subrouter()
	api.Use(func(orig http.Handler) http.Handler {
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
	api.HandleFunc("/status", handler.Status)
	api.HandleFunc("/loki/ready", handler.LokiReady(&cfg.Loki))
	api.HandleFunc("/loki/metrics", handler.LokiMetrics(&cfg.Loki))
	api.HandleFunc("/loki/buildinfo", handler.LokiBuildInfos(&cfg.Loki))
	api.HandleFunc("/loki/config/limits", handler.LokiConfig(&cfg.Loki, "limits_config"))
	api.HandleFunc("/loki/flows", handler.GetFlows(&cfg.Loki))
	api.HandleFunc("/loki/export", handler.ExportFlows(&cfg.Loki))
	api.HandleFunc("/loki/topology", handler.GetTopology(&cfg.Loki))
	api.HandleFunc("/resources/namespaces", handler.GetNamespaces(&cfg.Loki))
	api.HandleFunc("/resources/namespace/{namespace}/kind/{kind}/names", handler.GetNames(&cfg.Loki))
	api.HandleFunc("/resources/kind/{kind}/names", handler.GetNames(&cfg.Loki))
	api.HandleFunc("/frontend-config", handler.GetConfig(cfg.BuildVersion, cfg.BuildDate, cfg.FrontendConfig))

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/dist/")))
	return r
}
