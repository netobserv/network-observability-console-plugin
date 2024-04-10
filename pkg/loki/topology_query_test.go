package loki

import (
	"testing"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var lokiConfig = config.Loki{
	URL:    "http://loki",
	Labels: []string{"SrcK8S_Namespace", "SrcK8S_OwnerName", "DstK8S_Namespace", "DstK8S_OwnerName", "FlowDirection"},
}

func TestBuildTopologyQuery_SimpleAggregate(t *testing.T) {
	in := TopologyInput{
		Start:          "(start)",
		End:            "",
		Top:            "50",
		RateInterval:   "2m",
		Step:           "10s",
		DataField:      "Bytes",
		MetricFunction: constants.MetricFunctionRate,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "namespace",
		DedupMark:      true,
	}
	q, err := NewTopologyQuery(&lokiConfig, &in)
	require.NoError(t, err)
	result := q.Build()
	assert.Equal(
		t,
		"http://loki/loki/api/v1/query_range?query="+
			"topk(50,sum by(SrcK8S_Namespace,DstK8S_Namespace)(rate({app=\"netobserv-flowcollector\"}!~`Duplicate\":true`|json|unwrap Bytes|__error__=\"\"[2m])))&start=(start)&limit=50&step=10s",
		result,
	)
}

func TestBuildTopologyQuery_GroupsAndAggregate(t *testing.T) {
	in := TopologyInput{
		Start:          "(start)",
		End:            "",
		Top:            "50",
		RateInterval:   "2m",
		Step:           "10s",
		DataField:      "Bytes",
		MetricFunction: constants.MetricFunctionRate,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "namespace",
		Groups:         "hosts",
		DedupMark:      true,
	}
	q, err := NewTopologyQuery(&lokiConfig, &in)
	require.NoError(t, err)
	result := q.Build()
	assert.Equal(
		t,
		"http://loki/loki/api/v1/query_range?query="+
			"topk(50,sum by(SrcK8S_Namespace,DstK8S_Namespace,SrcK8S_HostName,DstK8S_HostName)(rate({app=\"netobserv-flowcollector\"}!~`Duplicate\":true`|json|unwrap Bytes|__error__=\"\"[2m])))&start=(start)&limit=50&step=10s",
		result,
	)
}

func TestBuildTopologyQuery_CustomAggregate(t *testing.T) {
	in := TopologyInput{
		Start:          "(start)",
		End:            "",
		Top:            "50",
		RateInterval:   "2m",
		Step:           "10s",
		DataField:      "Bytes",
		MetricFunction: constants.MetricFunctionRate,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "SomeField",
		DedupMark:      true,
	}
	q, err := NewTopologyQuery(&lokiConfig, &in)
	require.NoError(t, err)
	result := q.Build()
	assert.Equal(
		t,
		"http://loki/loki/api/v1/query_range?query="+
			"topk(50,sum by(SomeField)(rate({app=\"netobserv-flowcollector\"}!~`Duplicate\":true`|~`\"SomeField\"`|json|unwrap Bytes|__error__=\"\"[2m])))&start=(start)&limit=50&step=10s",
		result,
	)
}

func TestBuildTopologyQuery_CustomLabelAggregate(t *testing.T) {
	in := TopologyInput{
		Start:          "(start)",
		End:            "",
		Top:            "50",
		RateInterval:   "2m",
		Step:           "10s",
		DataField:      "Bytes",
		MetricFunction: constants.MetricFunctionRate,
		RecordType:     constants.RecordTypeLog,
		Aggregate:      "FlowDirection",
		DedupMark:      true,
	}
	q, err := NewTopologyQuery(&lokiConfig, &in)
	require.NoError(t, err)
	result := q.Build()
	assert.Equal(
		t,
		"http://loki/loki/api/v1/query_range?query="+
			"topk(50,sum by(FlowDirection)(rate({app=\"netobserv-flowcollector\"}!~`Duplicate\":true`|json|unwrap Bytes|__error__=\"\"[2m])))&start=(start)&limit=50&step=10s",
		result,
	)
}
