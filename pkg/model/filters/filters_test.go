package filters

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseFilters(t *testing.T) {
	// 2 groups
	groups, err := Parse(url.QueryEscape("foo~a,b&bar=c|baz=d"))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, SingleQuery{
		NewRegexMatch("foo", "a,b"),
		NewEqualMatch("bar", "c"),
	}, groups[0])
	assert.Equal(t, SingleQuery{
		NewEqualMatch("baz", "d"),
	}, groups[1])

	// Resource path + port, match all
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"&SrcPort=8080`))
	require.NoError(t, err)

	assert.Len(t, groups, 1)
	assert.Equal(t, SingleQuery{
		NewEqualMatch("SrcK8S_Type", `"Pod"`),
		NewEqualMatch("SrcK8S_Namespace", `"default"`),
		NewEqualMatch("SrcK8S_Name", `"test"`),
		NewEqualMatch("SrcPort", "8080"),
	}, groups[0])

	// Resource path + port, match any
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"|SrcPort=8080`))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, SingleQuery{
		NewEqualMatch("SrcK8S_Type", `"Pod"`),
		NewEqualMatch("SrcK8S_Namespace", `"default"`),
		NewEqualMatch("SrcK8S_Name", `"test"`),
	}, groups[0])

	assert.Equal(t, SingleQuery{
		NewEqualMatch("SrcPort", "8080"),
	}, groups[1])

	// Resource path + name, match all
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"&SrcK8S_Name="nomatch"`))
	require.NoError(t, err)

	assert.Len(t, groups, 1)
	assert.Equal(t, SingleQuery{
		NewEqualMatch("SrcK8S_Type", `"Pod"`),
		NewEqualMatch("SrcK8S_Namespace", `"default"`),
		NewEqualMatch("SrcK8S_Name", `"test"`),
		NewEqualMatch("SrcK8S_Name", `"nomatch"`),
	}, groups[0])
}

func TestParseCommon(t *testing.T) {
	groups, err := Parse(url.QueryEscape("srcns=a|srcns!=a&dstns=a"))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, SingleQuery{
		NewEqualMatch("srcns", "a"),
	}, groups[0])
	assert.Equal(t, SingleQuery{
		NewNotEqualMatch("srcns", "a"),
		NewEqualMatch("dstns", "a"),
	}, groups[1])
}

func TestDistribute(t *testing.T) {
	mq := MultiQueries{
		SingleQuery{NewEqualMatch("key1", "a"), NewEqualMatch("key2", "b")},
		SingleQuery{NewEqualMatch("key1", "AA"), NewEqualMatch("key3", "CC")},
		SingleQuery{NewEqualMatch("key-ignore", "ZZ")},
	}
	toDistribute := []SingleQuery{{NewEqualMatch("key10", "XX")}, {NewEqualMatch("key11", "YY")}}
	res := mq.Distribute(toDistribute, func(q SingleQuery) bool { return q[0].Key == "key-ignore" })

	assert.Len(t, res, 5)
	assert.Equal(t, SingleQuery{
		NewEqualMatch("key10", "XX"),
		NewEqualMatch("key1", "a"),
		NewEqualMatch("key2", "b"),
	}, res[0])
	assert.Equal(t, SingleQuery{
		NewEqualMatch("key11", "YY"),
		NewEqualMatch("key1", "a"),
		NewEqualMatch("key2", "b"),
	}, res[1])
	assert.Equal(t, SingleQuery{
		NewEqualMatch("key10", "XX"),
		NewEqualMatch("key1", "AA"),
		NewEqualMatch("key3", "CC"),
	}, res[2])
	assert.Equal(t, SingleQuery{
		NewEqualMatch("key11", "YY"),
		NewEqualMatch("key1", "AA"),
		NewEqualMatch("key3", "CC"),
	}, res[3])
	assert.Equal(t, SingleQuery{
		NewEqualMatch("key-ignore", "ZZ"),
	}, res[4])
}
