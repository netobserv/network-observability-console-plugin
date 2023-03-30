package loki

import (
	"net/url"
	"testing"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFlowQuery_AddLabelFilters(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, lokiURL, time.Second, "", "", false, false, "", false, "", "", "", false, []string{"foo", "flis"})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	err = query.addFilter(filters.NewMatch("foo", `"bar"`))
	require.NoError(t, err)
	err = query.addFilter(filters.NewMatch("flis", `"flas"`))
	require.NoError(t, err)
	urlQuery := query.Build()
	assert.Equal(t, `/loki/api/v1/query_range?query={app="netobserv-flowcollector",foo="bar",flis="flas"}`, urlQuery)
}

func TestQuery_BackQuote_Error(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, lokiURL, time.Second, "", "", false, false, "", false, "", "", "", false, []string{"lab1", "lab2"})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	assert.Error(t, query.addFilter(filters.NewMatch("key", "backquoted`val")))
}

func TestFlowQuery_AddNotLabelFilters(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, lokiURL, time.Second, "", "", false, false, "", false, "", "", "", false, []string{"foo", "flis"})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	err = query.addFilter(filters.NewMatch("foo", `"bar"`))
	require.NoError(t, err)
	err = query.addFilter(filters.NewNotMatch("flis", `"flas"`))
	require.NoError(t, err)
	urlQuery := query.Build()
	assert.Equal(t, `/loki/api/v1/query_range?query={app="netobserv-flowcollector",foo="bar",flis!="flas"}`, urlQuery)
}

func backtick(str string) string {
	return "`" + str + "`"
}

func TestFlowQuery_AddLineFilterMultipleValues(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, lokiURL, time.Second, "", "", false, false, "", false, "", "", "", false, []string{})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	err = query.addFilter(filters.NewMatch("foo", `bar,baz`))
	require.NoError(t, err)
	urlQuery := query.Build()
	assert.Equal(t, `/loki/api/v1/query_range?query={app="netobserv-flowcollector"}|~`+backtick(`foo":"(?i)[^"]*bar.*"|foo":"(?i)[^"]*baz.*"`), urlQuery)
}

func TestFlowQuery_AddNotLineFilters(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, lokiURL, time.Second, "", "", false, false, "", false, "", "", "", false, []string{})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	err = query.addFilter(filters.NewMatch("foo", `"bar"`))
	require.NoError(t, err)
	err = query.addFilter(filters.NewNotMatch("flis", `"flas"`))
	require.NoError(t, err)
	urlQuery := query.Build()
	assert.Equal(t, `/loki/api/v1/query_range?query={app="netobserv-flowcollector"}|~`+backtick(`foo":"bar"`)+`!~`+backtick(`flis":"flas"`), urlQuery)
}

func TestFlowQuery_AddLineFiltersWithEmpty(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, lokiURL, time.Second, "", "", false, false, "", false, "", "", "", false, []string{})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	err = query.addFilter(filters.NewMatch("foo", `"bar"`))
	require.NoError(t, err)
	err = query.addFilter(filters.NewMatch("flis", `""`))
	require.NoError(t, err)
	urlQuery := query.Build()
	assert.Equal(t, `/loki/api/v1/query_range?query={app="netobserv-flowcollector"}|~`+backtick(`foo":"bar"`)+`|json|flis=""`, urlQuery)
}

func TestFlowQuery_AddRecordTypeLabelFilter(t *testing.T) {
	lokiURL, err := url.Parse("/")
	require.NoError(t, err)
	cfg := NewConfig(lokiURL, lokiURL, time.Second, "", "", false, false, "", false, "", "", "", false, []string{"foo", "flis", "_RecordType"})
	query := NewFlowQueryBuilderWithDefaults(&cfg)
	err = query.addFilter(filters.NewMatch("foo", `"bar"`))
	require.NoError(t, err)
	err = query.addFilter(filters.NewMatch("flis", `"flas"`))
	require.NoError(t, err)
	urlQuery := query.Build()
	assert.Equal(t, `/loki/api/v1/query_range?query={app="netobserv-flowcollector",_RecordType="flowLog",foo="bar",flis="flas"}`, urlQuery)
}
