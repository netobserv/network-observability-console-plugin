package server

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
)

var slog = logrus.WithField("module", "server")

type Config struct {
	Port             int
	CertFile         string
	PrivateKeyFile   string
	CORSAllowOrigin  string
	CORSAllowMethods string
	CORSAllowHeaders string
	CORSMaxAge       string
	Loki             handler.LokiConfig
}

func Start(cfg *Config) {
	router := setupRoutes(cfg)
	router.Use(corsHeader(cfg))

	// Clients must use TLS 1.2 or higher
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}

	httpServer := &http.Server{
		Handler:      router,
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		TLSConfig:    tlsConfig,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	if cfg.CertFile != "" && cfg.PrivateKeyFile != "" {
		slog.Infof("listening on https://:%d", cfg.Port)
		panic(httpServer.ListenAndServeTLS(cfg.CertFile, cfg.PrivateKeyFile))
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
