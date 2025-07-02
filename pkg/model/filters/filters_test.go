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
		NewMatch("foo", "a,b"),
		NewEqual("bar", "c"),
	}, groups[0])
	assert.Equal(t, SingleQuery{
		NewEqual("baz", "d"),
	}, groups[1])

	// Resource path + port, match all
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"&SrcPort=8080`))
	require.NoError(t, err)

	assert.Len(t, groups, 1)
	assert.Equal(t, SingleQuery{
		NewEqual("SrcK8S_Type", `"Pod"`),
		NewEqual("SrcK8S_Namespace", `"default"`),
		NewEqual("SrcK8S_Name", `"test"`),
		NewEqual("SrcPort", "8080"),
	}, groups[0])

	// Resource path + port, match any
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"|SrcPort=8080`))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, SingleQuery{
		NewEqual("SrcK8S_Type", `"Pod"`),
		NewEqual("SrcK8S_Namespace", `"default"`),
		NewEqual("SrcK8S_Name", `"test"`),
	}, groups[0])

	assert.Equal(t, SingleQuery{
		NewEqual("SrcPort", "8080"),
	}, groups[1])

	// Resource path + name, match all
	groups, err = Parse(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"&SrcK8S_Name="nomatch"`))
	require.NoError(t, err)

	assert.Len(t, groups, 1)
	assert.Equal(t, SingleQuery{
		NewEqual("SrcK8S_Type", `"Pod"`),
		NewEqual("SrcK8S_Namespace", `"default"`),
		NewEqual("SrcK8S_Name", `"test"`),
		NewEqual("SrcK8S_Name", `"nomatch"`),
	}, groups[0])
}

func TestParseCommon(t *testing.T) {
	groups, err := Parse(url.QueryEscape("srcns=a|srcns!=a&dstns=a"))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, SingleQuery{
		NewEqual("srcns", "a"),
	}, groups[0])
	assert.Equal(t, SingleQuery{
		NewNotEqual("srcns", "a"),
		NewEqual("dstns", "a"),
	}, groups[1])
}

func TestDistribute(t *testing.T) {
	mq := MultiQueries{
		SingleQuery{NewEqual("key1", "a"), NewEqual("key2", "b")},
		SingleQuery{NewEqual("key1", "AA"), NewEqual("key3", "CC")},
		SingleQuery{NewEqual("key-ignore", "ZZ")},
	}
	toDistribute := []SingleQuery{{NewEqual("key10", "XX")}, {NewEqual("key11", "YY")}}
	res := mq.Distribute(toDistribute, func(q SingleQuery) bool { return q[0].Key == "key-ignore" })

	assert.Len(t, res, 5)
	assert.Equal(t, SingleQuery{
		NewEqual("key10", "XX"),
		NewEqual("key1", "a"),
		NewEqual("key2", "b"),
	}, res[0])
	assert.Equal(t, SingleQuery{
		NewEqual("key11", "YY"),
		NewEqual("key1", "a"),
		NewEqual("key2", "b"),
	}, res[1])
	assert.Equal(t, SingleQuery{
		NewEqual("key10", "XX"),
		NewEqual("key1", "AA"),
		NewEqual("key3", "CC"),
	}, res[2])
	assert.Equal(t, SingleQuery{
		NewEqual("key11", "YY"),
		NewEqual("key1", "AA"),
		NewEqual("key3", "CC"),
	}, res[3])
	assert.Equal(t, SingleQuery{
		NewEqual("key-ignore", "ZZ"),
	}, res[4])
}
