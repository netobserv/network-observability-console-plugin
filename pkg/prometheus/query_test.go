package prometheus

import (
	"testing"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/stretchr/testify/assert"
)

var qr = v1.Range{Start: time.Now().Add(-15 * time.Minute), End: time.Now(), Step: 30 * time.Second}

func TestBuildQuery_PromQLSimpleRateNoFilter(t *testing.T) {
	in := loki.TopologyInput{
		Top:            "50",
		RateInterval:   "2m",
		DataField:      "Bytes",
		MetricFunction: constants.MetricFunctionRate,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "namespace",
	}
	f := filters.SingleQuery{}
	q := NewQuery(&in, &qr, f, "my_metric")
	result := q.Build()
	assert.Equal(
		t,
		"topk(50,sum by(SrcK8S_Namespace,DstK8S_Namespace)(rate(my_metric{}[2m])))",
		result.PromQL,
	)
}

func TestBuildQuery_PromQLSimpleRateAndFilter(t *testing.T) {
	in := loki.TopologyInput{
		Top:            "50",
		RateInterval:   "2m",
		DataField:      "Bytes",
		MetricFunction: constants.MetricFunctionRate,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "namespace",
	}
	f := filters.SingleQuery{
		{
			Key:    fields.SrcNamespace,
			Values: `"a"`,
		},
	}
	q := NewQuery(&in, &qr, f, "my_metric")
	result := q.Build()
	assert.Equal(
		t,
		`topk(50,sum by(SrcK8S_Namespace,DstK8S_Namespace)(rate(my_metric{SrcK8S_Namespace="a"}[2m])))`,
		result.PromQL,
	)
}

func TestBuildQuery_PromQLRateMultiFilter(t *testing.T) {
	in := loki.TopologyInput{
		Top:            "50",
		RateInterval:   "2m",
		DataField:      "Bytes",
		MetricFunction: constants.MetricFunctionRate,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "namespace",
	}
	f := filters.SingleQuery{
		{
			Key:    fields.SrcNamespace,
			Values: `"a","b"`,
		},
	}
	q := NewQuery(&in, &qr, f, "my_metric")
	result := q.Build()
	assert.Equal(
		t,
		`topk(50,sum by(SrcK8S_Namespace,DstK8S_Namespace)(rate(my_metric{SrcK8S_Namespace=~"^a$|^b$"}[2m])))`,
		result.PromQL,
	)
}

func TestBuildQuery_PromQLHistogramAverage(t *testing.T) {
	in := loki.TopologyInput{
		Top:            "50",
		RateInterval:   "2m",
		DataField:      "TimeFlowRttNs",
		MetricFunction: constants.MetricFunctionRate,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "namespace",
	}
	f := filters.SingleQuery{
		{
			Key:    fields.SrcNamespace,
			Values: `"a"`,
		},
	}
	q := NewQuery(&in, &qr, f, "my_metric_bucket")
	result := q.Build()
	assert.Equal(
		t,
		`topk(50,sum by(SrcK8S_Namespace,DstK8S_Namespace)(rate(my_metric_sum{SrcK8S_Namespace="a"}[2m])/rate(my_metric_count{SrcK8S_Namespace="a"}[2m]))*1000)`,
		result.PromQL,
	)
}

func TestBuildQuery_PromQLHistogramP99(t *testing.T) {
	in := loki.TopologyInput{
		Top:            "50",
		RateInterval:   "2m",
		DataField:      "TimeFlowRttNs",
		MetricFunction: constants.MetricFunctionP99,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "namespace",
	}
	f := filters.SingleQuery{
		{
			Key:    fields.SrcNamespace,
			Values: `"a"`,
		},
	}
	q := NewQuery(&in, &qr, f, "my_metric_bucket")
	result := q.Build()
	assert.Equal(
		t,
		`topk(50,histogram_quantile(0.99,sum by(SrcK8S_Namespace,DstK8S_Namespace,le)(rate(my_metric_bucket{SrcK8S_Namespace="a"}[2m])))*1000)`,
		result.PromQL,
	)
}
