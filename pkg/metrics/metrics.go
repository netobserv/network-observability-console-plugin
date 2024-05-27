package metrics

import (
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

const prefix = "netobserv"

var (
	httpCallsDurationHisto = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    prefix + "_http_api_calls_duration",
		Help:    "Time measurements of HTTP API calls",
		Buckets: prometheus.DefBuckets,
	}, []string{"handler", "code"})
	lokiCallsDurationHisto = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    prefix + "_loki_calls_duration",
		Help:    "Time measurements of calls to Loki",
		Buckets: prometheus.DefBuckets,
	}, []string{"code"})
	promCallsDurationHisto = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    prefix + "_prom_calls_duration",
		Help:    "Time measurements of calls to Prometheus",
		Buckets: prometheus.DefBuckets,
	}, []string{"code"})
)

func ObserveHTTPCall(handler string, code int, startTime time.Time) {
	httpCallsDurationHisto.WithLabelValues(handler, strconv.Itoa(code)).Observe(time.Since(startTime).Seconds())
}

func ObserveLokiCall(code int, startTime time.Time) {
	lokiCallsDurationHisto.WithLabelValues(strconv.Itoa(code)).Observe(time.Since(startTime).Seconds())
}

func ObservePromCall(code int, startTime time.Time) {
	promCallsDurationHisto.WithLabelValues(strconv.Itoa(code)).Observe(time.Since(startTime).Seconds())
}
