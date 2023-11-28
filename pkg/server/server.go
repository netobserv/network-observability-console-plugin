package server

import (
	"fmt"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
)

var slog = logrus.WithField("module", "server")

type Config struct {
	BuildVersion     string
	BuildDate        string
	Port             int
	CertPath         string
	KeyPath          string
	CORSAllowOrigin  string
	CORSAllowMethods string
	CORSAllowHeaders string
	CORSMaxAge       string
	Loki             loki.Config
	ConfigPath       string
}

func Start(cfg *Config, authChecker auth.Checker) {
	router := setupRoutes(cfg, authChecker)
	router.Use(corsHeader(cfg))

	httpServer := defaultServer(&http.Server{
		Handler:      router,
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		WriteTimeout: 30 * time.Second,
	})

	if cfg.CertPath != "" && cfg.KeyPath != "" {
		slog.Infof("listening on https://:%d", cfg.Port)
		panic(httpServer.ListenAndServeTLS(cfg.CertPath, cfg.KeyPath))
	} else {
		slog.Infof("listening on http://:%d", cfg.Port)
		panic(httpServer.ListenAndServe())
	}
}

func corsHeader(cfg *Config) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			headers := w.Header()
			if cfg.CORSAllowOrigin != "" {
				headers.Set("Access-Control-Allow-Origin", cfg.CORSAllowOrigin)
			}
			if cfg.CORSAllowHeaders != "" {
				headers.Set("Access-Control-Allow-Header", cfg.CORSAllowHeaders)
			}
			if cfg.CORSAllowMethods != "" {
				headers.Set("Access-Control-Allow-Methods", cfg.CORSAllowMethods)
			}
			if cfg.CORSMaxAge != "" {
				headers.Set("Access-Control-Max-Age", cfg.CORSMaxAge)
			}
			next.ServeHTTP(w, r)
		})
	}
}
