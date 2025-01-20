package server

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/prometheus"
)

func setupRoutes(ctx context.Context, cfg *config.Config, authChecker auth.Checker) *mux.Router {
	var promInventory *prometheus.Inventory
	if cfg.IsPromEnabled() {
		promInventory = prometheus.NewInventory(&cfg.Prometheus)
	}

	r := mux.NewRouter()
	h := handler.Handlers{Cfg: cfg, PromInventory: promInventory}

	api := r.PathPrefix("/api").Subrouter()
	api.Use(func(orig http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if err := authChecker.CheckAuth(ctx, r.Header); err != nil {
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

	// Server status
	api.HandleFunc("/status", h.Status(ctx))

	// Loki endpoints
	api.HandleFunc("/loki/ready", h.LokiReady())
	api.HandleFunc("/loki/metrics", forceCheckAdmin(authChecker, h.LokiMetrics()))
	api.HandleFunc("/loki/buildinfo", forceCheckAdmin(authChecker, h.LokiBuildInfos()))
	api.HandleFunc("/loki/config/limits", forceCheckAdmin(authChecker, h.LokiLimits()))
	api.HandleFunc("/loki/flow/records", h.GetFlows(ctx))
	api.HandleFunc("/loki/export", h.ExportFlows(ctx))

	// Common endpoints
	api.HandleFunc("/flow/metrics", h.GetTopology(ctx))
	api.HandleFunc("/resources/clusters", h.GetClusters(ctx))
	api.HandleFunc("/resources/udns", h.GetUDNs(ctx))
	api.HandleFunc("/resources/zones", h.GetZones(ctx))
	api.HandleFunc("/resources/namespaces", h.GetNamespaces(ctx))
	api.HandleFunc("/resources/names", h.GetNames(ctx))

	// Frontend files
	api.HandleFunc("/frontend-config", h.GetFrontendConfig())
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/dist/")))
	return r
}

func forceCheckAdmin(authChecker auth.Checker, handle func(http.ResponseWriter, *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := authChecker.CheckAdmin(context.TODO(), r.Header); err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			_, err2 := w.Write([]byte(err.Error()))
			if err2 != nil {
				logrus.Errorf("Error while responding an error: %v (initial was: %v)", err2, err)
			}
			return
		}
		handle(w, r)
	}
}
