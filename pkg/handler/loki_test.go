package handler

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProcessParamTwoPodsAndFlowDirection(t *testing.T) {
	labelFilters := strings.Builder{}
	lineFilters := strings.Builder{}
	ipFilters := strings.Builder{}
	extraArgs := strings.Builder{}
	err := processParam("SrcPod", "test-pod-1,test-pod-2", &labelFilters, &lineFilters, &ipFilters, &extraArgs)
	require.NoError(t, err)
	err = processParam("FlowDirection", "0", &labelFilters, &lineFilters, &ipFilters, &extraArgs)
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
	err := processParam("DstNamespace", "test-ns-1,test-ns-2", &labelFilters, &lineFilters, &ipFilters, &extraArgs)
	require.NoError(t, err)
	err = processParam("DstAddr", "10.0.40.0/16", &labelFilters, &lineFilters, &ipFilters, &extraArgs)
	require.NoError(t, err)
	err = processParam("SrcAddr", "10.0.40.0/16", &labelFilters, &lineFilters, &ipFilters, &extraArgs)
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
	err := processParam("SrcPort", "80", &labelFilters, &lineFilters, &ipFilters, &extraArgs)
	require.NoError(t, err)
	err = processParam("limit", "500", &labelFilters, &lineFilters, &ipFilters, &extraArgs)
	require.NoError(t, err)

	assert.Empty(t, labelFilters.String())
	assert.Empty(t, ipFilters.String())
	assert.Equal(t, `&limit=500`, extraArgs.String())
	assert.Equal(t, "|~`\"SrcPort\":80`", lineFilters.String())
}
