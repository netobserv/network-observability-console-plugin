package loki

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestQuery_ToURL_ConvertToAnyMatch(t *testing.T) {
	type testCase struct {
		title     string
		in        Query
		expect    string
		expectAny string
	}
	for _, tc := range []testCase{{
		title: "streamSelector only",
		in: Query{streamSelector: []labelFilter{
			stringLabelFilter("app", labelEqual, "flows"),
			stringLabelFilter("foo", labelMatches, ".*bar.*"),
			stringLabelFilter("baz", labelMatches, ".*bae.*"),
		}},
		expect:    `/loki/api/v1/query_range?query={app="flows",foo=~".*bar.*",baz=~".*bae.*"}`,
		expectAny: `/loki/api/v1/query_range?query={dont="fail"}|json|app="flows"+or+foo=~".*bar.*"+or+baz=~".*bae.*"`,
	}, {
		title: "streamSelector with line filters",
		in: Query{
			streamSelector: []labelFilter{
				stringLabelFilter("app", labelEqual, "netobs"),
			},
			lineFilters: []string{`"DstPort":1234`, `"Namespace":".*hiya`},
		},
		expect:    "/loki/api/v1/query_range?query={app=\"netobs\"}|~`\"DstPort\":1234`|~`\"Namespace\":\".*hiya`",
		expectAny: "/loki/api/v1/query_range?query={dont=\"fail\"}|json|app=\"netobs\"+or+DstPort=1234+or+Namespace=~`.*hiya.*`",
	}, {
		title: "streamSelector with label filters",
		in: Query{
			streamSelector: []labelFilter{stringLabelFilter("app", labelEqual, "some-app")},
			labelJoiner:    joinOr,
			labelFilters: []labelFilter{
				stringLabelFilter("foo", labelMatches, "bar"),
				intLabelFilter("port", 1234),
				ipLabelFilter("SrcAddr", "123.0.0.0/16"),
			},
		},
		expect:    `/loki/api/v1/query_range?query={app="some-app"}|json|foo=~"bar"+or+port=1234+or+SrcAddr=ip("123.0.0.0/16")`,
		expectAny: `/loki/api/v1/query_range?query={dont="fail"}|json|app="some-app"+or+foo=~"bar"+or+port=1234+or+SrcAddr=ip("123.0.0.0/16")`,
	}, {
		title: "streamSelector + line filters + label filters",
		in: Query{
			streamSelector: []labelFilter{stringLabelFilter("app", labelEqual, "the-app")},
			labelJoiner:    joinOr,
			labelFilters:   []labelFilter{stringLabelFilter("foo", labelMatches, "bar")},
			lineFilters:    []string{`"DstPod":".*podaco"`},
		},
		expect:    "/loki/api/v1/query_range?query={app=\"the-app\"}|~`\"DstPod\":\".*podaco\"`|json|foo=~\"bar\"",
		expectAny: "/loki/api/v1/query_range?query={dont=\"fail\"}|json|app=\"the-app\"+or+foo=~\"bar\"+or+DstPod=~`.*podaco.*`",
	}} {
		t.Run(tc.title, func(t *testing.T) {
			urlQuery, err := tc.in.URLQuery()
			require.NoError(t, err)
			assert.Equal(t, tc.expect, urlQuery)

			anyMatchQuery := tc.in.convertToAnyMatch()
			// we need to have at least a stream selector, so we add a label for testing purposes
			// (in production, we add the app label)
			anyMatchQuery.streamSelector = append(anyMatchQuery.streamSelector,
				stringLabelFilter("dont", labelEqual, "fail"))
			anyMatchURL, err := anyMatchQuery.URLQuery()
			require.NoError(t, err)
			assert.Equal(t, tc.expectAny, anyMatchURL)
		})
	}
}

func TestQuery_AddURLParam(t *testing.T) {
	query := Query{
		streamSelector: []labelFilter{stringLabelFilter("app", labelEqual, "the-app")},
	}
	query.addURLParam("foo", "bar")
	query.addURLParam("flis", "flas")
	urlQuery, err := query.URLQuery()
	require.NoError(t, err)
	assert.Equal(t, `/loki/api/v1/query_range?query={app="the-app"}&foo=bar&flis=flas`, urlQuery)
}

func TestQuery_BackQuote_Error(t *testing.T) {
	query := NewQuery("/", []string{"lab1", "lab2"}, false)
	assert.Error(t, query.AddParam("key", "backquoted`val"))
}
