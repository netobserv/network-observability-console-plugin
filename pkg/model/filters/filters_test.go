package filters

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseFilters(t *testing.T) {
	// 2 groups
	groups, err := Parse(url.QueryEscape("foo=a,b&bar=c|baz=d"))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, SingleQuery{
		NewMatch("foo", "a,b"),
		NewMatch("bar", "c"),
	}, groups[0])
	assert.Equal(t, SingleQuery{
		NewMatch("baz", "d"),
	}, groups[1])

	// Resource path + port, match all
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"&SrcPort=8080`))
	require.NoError(t, err)

	assert.Len(t, groups, 1)
	assert.Equal(t, SingleQuery{
		NewMatch("SrcK8S_Type", `"Pod"`),
		NewMatch("SrcK8S_Namespace", `"default"`),
		NewMatch("SrcK8S_Name", `"test"`),
		NewMatch("SrcPort", "8080"),
	}, groups[0])

	// Resource path + port, match any
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"|SrcPort=8080`))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, SingleQuery{
		NewMatch("SrcK8S_Type", `"Pod"`),
		NewMatch("SrcK8S_Namespace", `"default"`),
		NewMatch("SrcK8S_Name", `"test"`),
	}, groups[0])

	assert.Equal(t, SingleQuery{
		NewMatch("SrcPort", "8080"),
	}, groups[1])

	// Resource path + name, match all
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"&SrcK8S_Name="nomatch"`))
	require.NoError(t, err)

	assert.Len(t, groups, 1)
	assert.Equal(t, SingleQuery{
		NewMatch("SrcK8S_Type", `"Pod"`),
		NewMatch("SrcK8S_Namespace", `"default"`),
		NewMatch("SrcK8S_Name", `"test"`),
		NewMatch("SrcK8S_Name", `"nomatch"`),
	}, groups[0])
}

func TestParseCommon(t *testing.T) {
	groups, err := Parse(url.QueryEscape("srcns=a|srcns!=a&dstns=a"))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, SingleQuery{
		NewMatch("srcns", "a"),
	}, groups[0])
	assert.Equal(t, SingleQuery{
		NewNotMatch("srcns", "a"),
		NewMatch("dstns", "a"),
	}, groups[1])
}

func TestSplitForReportersMerge_NoSplit(t *testing.T) {
	q1, q2 := SplitForReportersMerge(SingleQuery{NewMatch("srcns", "a"), NewMatch("FlowDirection", "0")})
	assert.Nil(t, q2)
	assert.Len(t, q1, 2)
	assert.Equal(t, SingleQuery{
		NewMatch("srcns", "a"),
		NewMatch("FlowDirection", "0"),
	}, q1)
}

func TestSplitForReportersMerge(t *testing.T) {
	q1, q2 := SplitForReportersMerge(SingleQuery{NewMatch("srcns", "a"), NewMatch("dstns", "b")})

	assert.Len(t, q1, 3)
	assert.Equal(t, SingleQuery{
		NewMatch("FlowDirection", `"1"`),
		NewMatch("srcns", "a"),
		NewMatch("dstns", "b"),
	}, q1)
	assert.Len(t, q2, 4)
	assert.Equal(t, SingleQuery{
		NewMatch("FlowDirection", `"0"`),
		NewMatch("SrcK8S_OwnerName", `""`),
		NewMatch("srcns", "a"),
		NewMatch("dstns", "b"),
	}, q2)
}
