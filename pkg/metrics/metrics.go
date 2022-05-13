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
	lokiUnitCallsDurationHisto = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    prefix + "_loki_unit_calls_duration",
		Help:    "Time measurements of unit calls to Loki",
		Buckets: prometheus.DefBuckets,
	}, []string{"code"})
	lokiParallelCallsDurationHisto = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    prefix + "_loki_parallel_calls_duration",
		Help:    "Time measurements of parallel calls to Loki",
		Buckets: prometheus.DefBuckets,
	}, []string{"type", "code"})
	lokiParallelCallsNbQueriesHisto = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    prefix + "_loki_parallel_calls_number",
		Help:    "Number of parallel calls to Loki",
		Buckets: prometheus.DefBuckets,
	}, []string{"type", "code"})
)

func ObserveHTTPCall(handler string, code int, startTime time.Time) {
	httpCallsDurationHisto.WithLabelValues(handler, strconv.Itoa(code)).Observe(time.Since(startTime).Seconds())
}

func ObserveLokiUnitCall(code int, startTime time.Time) {
	lokiUnitCallsDurationHisto.WithLabelValues(strconv.Itoa(code)).Observe(time.Since(startTime).Seconds())
}

func ObserveLokiParallelCall(queryType string, code, nbQueries int, startTime time.Time) {
	lokiParallelCallsDurationHisto.WithLabelValues(queryType, strconv.Itoa(code)).Observe(time.Since(startTime).Seconds())
	lokiParallelCallsNbQueriesHisto.WithLabelValues(queryType, strconv.Itoa(code)).Observe(float64(nbQueries))
}
