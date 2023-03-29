package server

import (
	"crypto/tls"
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

var mlog = logrus.WithField("module", "metrics-server")

type MetricsConfig struct {
	Port           int
	CertFile       string
	PrivateKeyFile string
}

func StartMetrics(cfg *MetricsConfig) {
	promServer := &http.Server{
		Addr: fmt.Sprintf(":%d", cfg.Port),
		// TLS clients must use TLS 1.2 or higher
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
	}

	// The Handler function provides a default handler to expose metrics
	// via an HTTP server. "/metrics" is the usual endpoint for that.
	http.Handle("/metrics", promhttp.Handler())

	if cfg.CertFile != "" && cfg.PrivateKeyFile != "" {
		mlog.Infof("listening on https://:%d", cfg.Port)
		panic(promServer.ListenAndServeTLS(cfg.CertFile, cfg.PrivateKeyFile))
	} else {
		mlog.Infof("listening on http://:%d", cfg.Port)
		panic(promServer.ListenAndServe())
	}
}
