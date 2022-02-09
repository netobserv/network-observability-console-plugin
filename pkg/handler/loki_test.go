package handler

import (
	"strings"
	"testing"
	"time"

	"github.com/grafana/loki/pkg/loghttp"
	"github.com/grafana/loki/pkg/logql/stats"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProcessParamTwoPodsAndFlowDirection(t *testing.T) {
	labelFilters := strings.Builder{}
	lineFilters := strings.Builder{}
	ipFilters := strings.Builder{}
	extraArgs := strings.Builder{}
	err := processParam("SrcPod", "test-pod-1,test-pod-2", &labelFilters, &lineFilters, &ipFilters, &extraArgs, nil)
	require.NoError(t, err)
	err = processParam("FlowDirection", "0", &labelFilters, &lineFilters, &ipFilters, &extraArgs, nil)
	require.NoError(t, err)

	assert.Empty(t, labelFilters.String())
	assert.Empty(t, ipFilters.String())
	assert.Empty(t, extraArgs.String())
	assert.Equal(t, "|~`\"SrcPod\":\"[^\"]*test-pod-1|\"SrcPod\":\"[^\"]*test-pod-2`|~`\"FlowDirection\":0`", lineFilters.String())
}

func TestProcessParamTwoNamespacesAndIP(t *testing.T) {
	labelFilters := strings.Builder{}
	lineFilters := strings.Builder{}
	ipFilters := strings.Builder{}
	extraArgs := strings.Builder{}
	err := processParam("DstNamespace", "test-ns-1,test-ns-2", &labelFilters, &lineFilters, &ipFilters, &extraArgs, nil)
	require.NoError(t, err)
	err = processParam("DstAddr", "10.0.40.0/16", &labelFilters, &lineFilters, &ipFilters, &extraArgs, nil)
	require.NoError(t, err)
	err = processParam("SrcAddr", "10.0.40.0/16", &labelFilters, &lineFilters, &ipFilters, &extraArgs, nil)
	require.NoError(t, err)

	assert.Equal(t, `,DstNamespace=~".*test-ns-1.*|.*test-ns-2.*"`, labelFilters.String())
	assert.Equal(t, `|json|DstAddr=ip("10.0.40.0/16")|SrcAddr=ip("10.0.40.0/16")`, ipFilters.String())
	assert.Empty(t, extraArgs.String())
	assert.Empty(t, lineFilters.String())
}

func TestProcessParamPortAndLimit(t *testing.T) {
	labelFilters := strings.Builder{}
	lineFilters := strings.Builder{}
	ipFilters := strings.Builder{}
	extraArgs := strings.Builder{}
	err := processParam("SrcPort", "80", &labelFilters, &lineFilters, &ipFilters, &extraArgs, nil)
	require.NoError(t, err)
	err = processParam("limit", "500", &labelFilters, &lineFilters, &ipFilters, &extraArgs, nil)
	require.NoError(t, err)

	assert.Empty(t, labelFilters.String())
	assert.Empty(t, ipFilters.String())
	assert.Equal(t, `&limit=500`, extraArgs.String())
	assert.Equal(t, "|~`\"SrcPort\":80`", lineFilters.String())
}

func TestProcessParamBackquoteUnpermitted(t *testing.T) {
	labelFilters := strings.Builder{}
	lineFilters := strings.Builder{}
	ipFilters := strings.Builder{}
	extraArgs := strings.Builder{}
	err := processParam("SrcPod", "test-p`od-1", &labelFilters, &lineFilters, &ipFilters, &extraArgs, nil)
	require.Error(t, err)
}

func TestCSVDatas(t *testing.T) {
	now := time.Now()
	qr := loghttp.QueryResponse{
		Data: loghttp.QueryResponseData{
			ResultType: "streams",
			Result: loghttp.Streams{{
				Labels: map[string]string{"app": "my-app-label"},
				Entries: []loghttp.Entry{{
					Timestamp: now,
					Line:      "{\"BiFlowDirection\":0,\"Bytes\":0,\"CustomBytes1\":null,\"CustomBytes2\":null,\"CustomInteger1\":0,\"CustomInteger2\":0,\"DstAS\":0,\"DstAddr\":\"10.217.0.8\",\"DstHostIP\":\"192.168.126.11\",\"DstMac\":\"8b:83:a4:83:76:41\",\"DstNet\":0,\"DstPod\":\"nflow-generator-698ddbfc75-5l5jx\",\"DstPort\":4289,\"DstVlan\":0,\"DstWorkloadKind\":\"Deployment\",\"EgressVrfID\":0,\"Etype\":2048,\"FlowDirection\":0,\"ForwardingStatus\":0,\"FragmentId\":0,\"FragmentOffset\":0,\"HasMPLS\":false,\"IPTTL\":0,\"IPTos\":0,\"IPv6FlowLabel\":0,\"IcmpCode\":0,\"IcmpType\":0,\"InIf\":0,\"IngressVrfID\":0,\"MPLS1Label\":0,\"MPLS1TTL\":0,\"MPLS2Label\":0,\"MPLS2TTL\":0,\"MPLS3Label\":0,\"MPLS3TTL\":0,\"MPLSCount\":0,\"MPLSLastLabel\":0,\"MPLSLastTTL\":0,\"OutIf\":0,\"Packets\":0,\"Proto\":34,\"SamplerAddress\":\"CtkACA==\",\"SamplingRate\":0,\"SequenceNum\":234267258,\"SrcAS\":0,\"SrcAddr\":\"10.217.0.15\",\"SrcHostIP\":\"192.168.126.11\",\"SrcMac\":\"2f:f3:40:59:b0:cc\",\"SrcNet\":0,\"SrcPod\":\"openshift-config-operator-699cb99bd9-5hrs4\",\"SrcPort\":3139,\"SrcVlan\":0,\"SrcWorkloadKind\":\"Deployment\",\"TCPFlags\":0,\"TimeFlowEnd\":0,\"TimeFlowStart\":0,\"TimeReceived\":1644246066,\"Type\":4,\"VlanId\":0}",
				}},
			}},
			Statistics: stats.Result{},
		},
	}
	datas, err := getCSVDatas(&qr, nil)
	require.NoError(t, err)
	require.Len(t, datas, 2)
	require.Len(t, datas[0], 61)

	datas, err = getCSVDatas(&qr, &[]string{"Timestamp", "SrcPod"})
	require.NoError(t, err)
	require.Len(t, datas, 2)
	require.Len(t, datas[0], 2)
	require.Equal(t, datas[1][0], now.String())
	require.Equal(t, datas[1][1], "openshift-config-operator-699cb99bd9-5hrs4")
}

func TestCSVErrors(t *testing.T) {
	now := time.Now()
	qr := loghttp.QueryResponse{
		Data: loghttp.QueryResponseData{
			ResultType: "streams",
			Result: loghttp.Streams{{
				Labels: map[string]string{"app": "my-app-label"},
				Entries: []loghttp.Entry{{
					Timestamp: now,
					Line:      "Invalid JSON",
				}},
			}},
			Statistics: stats.Result{},
		},
	}

	datas, err := getCSVDatas(&qr, &[]string{})
	require.Nil(t, datas)
	require.Error(t, err, "columns can't be empty if specified")

	datas, err = getCSVDatas(&qr, nil)
	require.Nil(t, datas)
	require.Error(t, err, "cannot unmarshal line Invalid JSON")
}
