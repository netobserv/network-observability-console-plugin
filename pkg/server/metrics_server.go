package server

import (
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

var mlog = logrus.WithField("module", "metrics-server")

type MetricsConfig struct {
	Port     int
	CertPath string
	KeyPath  string
}

func StartMetrics(cfg *MetricsConfig) {
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())

	promServer := defaultServer(&http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: mux,
	})

	if cfg.CertPath != "" && cfg.KeyPath != "" {
		mlog.Infof("listening on https://:%d", cfg.Port)
		panic(promServer.ListenAndServeTLS(cfg.CertPath, cfg.KeyPath))
	}
	mlog.Infof("listening on http://:%d", cfg.Port)
	panic(promServer.ListenAndServe())
}
