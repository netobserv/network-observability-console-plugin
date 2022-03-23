package handler

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseFilters(t *testing.T) {
	// 2 groups
	groups, err := parseFilters(url.QueryEscape("foo=a,b&bar=c|baz=d"))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, map[string]string{
		"foo": "a,b",
		"bar": "c",
	}, groups[0])
	assert.Equal(t, map[string]string{
		"baz": "d",
	}, groups[1])

	// Resource path + port, match all
	groups, err = parseFilters(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"&SrcPort=8080`))
	require.NoError(t, err)

	assert.Len(t, groups, 1)
	assert.Equal(t, map[string]string{
		"SrcK8S_Type":      `"Pod"`,
		"SrcK8S_Namespace": `"default"`,
		"SrcK8S_Name":      `"test"`,
		"SrcPort":          `8080`,
	}, groups[0])

	// Resource path + port, match any
	groups, err = parseFilters(url.QueryEscape(`SrcK8S_Type="Pod"&SrcK8S_Namespace="default"&SrcK8S_Name="test"|SrcPort=8080`))
	require.NoError(t, err)

	assert.Len(t, groups, 2)
	assert.Equal(t, map[string]string{
		"SrcK8S_Type":      `"Pod"`,
		"SrcK8S_Namespace": `"default"`,
		"SrcK8S_Name":      `"test"`,
	}, groups[0])

	assert.Equal(t, map[string]string{
		"SrcPort": `8080`,
	}, groups[1])
}
