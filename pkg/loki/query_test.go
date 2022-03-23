package loki

import (
	"net/url"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFlowQuery_AddLabelFilters(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, time.Second, "", []string{"foo", "flis"})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	err = query.AddFilter("foo", `"bar"`)
	require.NoError(t, err)
	err = query.AddFilter("flis", `"flas"`)
	require.NoError(t, err)
	urlQuery := query.Build()
	assert.Equal(t, `/loki/api/v1/query_range?query={app="netobserv-flowcollector",foo="bar",flis="flas"}`, urlQuery)
}

func TestQuery_BackQuote_Error(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, time.Second, "", []string{"lab1", "lab2"})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	assert.Error(t, query.AddFilter("key", "backquoted`val"))
}
