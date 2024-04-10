package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/prometheus"
)

var slog = logrus.WithField("module", "server")

func Start(ctx context.Context, cfg *config.Config, authChecker auth.Checker) {
	var promInventory *prometheus.Inventory
	if cfg.IsPromEnabled() {
		promInventory = prometheus.NewInventory(ctx, &cfg.Prometheus)
	}

	router := setupRoutes(ctx, cfg, authChecker, promInventory)
	router.Use(corsHeader(cfg))

	writeTimeout := 30 * time.Second
	if cfg.Loki.Timeout.Seconds() > writeTimeout.Seconds() {
		writeTimeout = cfg.Loki.Timeout.Duration
	}

	httpServer := defaultServer(&http.Server{
		Handler:      router,
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		WriteTimeout: writeTimeout,
	})

	if cfg.Server.CertPath != "" && cfg.Server.KeyPath != "" {
		slog.Infof("listening on https://:%d", cfg.Server.Port)
		panic(httpServer.ListenAndServeTLS(cfg.Server.CertPath, cfg.Server.KeyPath))
	}
	slog.Infof("listening on http://:%d", cfg.Server.Port)
	panic(httpServer.ListenAndServe())
}

func corsHeader(cfg *config.Config) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			headers := w.Header()
			if cfg.Server.CORSOrigin != "" {
				headers.Set("Access-Control-Allow-Origin", cfg.Server.CORSOrigin)
			}
			if cfg.Server.CORSHeaders != "" {
				headers.Set("Access-Control-Allow-Header", cfg.Server.CORSHeaders)
			}
			if cfg.Server.CORSMethods != "" {
				headers.Set("Access-Control-Allow-Methods", cfg.Server.CORSMethods)
			}
			if cfg.Server.CORSMaxAge != "" {
				headers.Set("Access-Control-Max-Age", cfg.Server.CORSMaxAge)
			}
			next.ServeHTTP(w, r)
		})
	}
}
