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

func TestDistribute(t *testing.T) {
	mq := MultiQueries{
		SingleQuery{NewMatch("key1", "a"), NewMatch("key2", "b")},
		SingleQuery{NewMatch("key1", "AA"), NewMatch("key3", "CC")},
		SingleQuery{NewMatch("key-ignore", "ZZ")},
	}
	toDistribute := []SingleQuery{{NewMatch("key10", "XX")}, {NewMatch("key11", "YY")}}
	res := mq.Distribute(toDistribute, func(q SingleQuery) bool { return q[0].Key == "key-ignore" })

	assert.Len(t, res, 5)
	assert.Equal(t, SingleQuery{
		NewMatch("key10", "XX"),
		NewMatch("key1", "a"),
		NewMatch("key2", "b"),
	}, res[0])
	assert.Equal(t, SingleQuery{
		NewMatch("key11", "YY"),
		NewMatch("key1", "a"),
		NewMatch("key2", "b"),
	}, res[1])
	assert.Equal(t, SingleQuery{
		NewMatch("key10", "XX"),
		NewMatch("key1", "AA"),
		NewMatch("key3", "CC"),
	}, res[2])
	assert.Equal(t, SingleQuery{
		NewMatch("key11", "YY"),
		NewMatch("key1", "AA"),
		NewMatch("key3", "CC"),
	}, res[3])
	assert.Equal(t, SingleQuery{
		NewMatch("key-ignore", "ZZ"),
	}, res[4])
}
