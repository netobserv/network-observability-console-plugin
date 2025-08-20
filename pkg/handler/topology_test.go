package handler

import (
	"testing"

	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
	"github.com/stretchr/testify/assert"
)

func TestSplitForReportersMerge_NoSplit(t *testing.T) {
	mq := filters.MultiQueries{filters.SingleQuery{filters.NewRegexMatch("srcns", "a"), filters.NewRegexMatch("FlowDirection", string(constants.Ingress))}}
	res := expandQueries(mq, "", func(filters.SingleQuery) bool { return false })
	assert.Len(t, res, 1)
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("srcns", "a"),
		filters.NewRegexMatch("FlowDirection", string(constants.Ingress)),
	}, res[0])
}

func TestSplitForReportersMerge(t *testing.T) {
	mq := filters.MultiQueries{filters.SingleQuery{filters.NewRegexMatch("srcns", "a"), filters.NewRegexMatch("dstns", "b")}}
	res := expandQueries(mq, "", func(filters.SingleQuery) bool { return false })

	assert.Len(t, res, 2)
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Ingress)+`","`+string(constants.Inner)+`"`),
		filters.NewRegexMatch("srcns", "a"),
		filters.NewRegexMatch("dstns", "b"),
	}, res[0])
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Egress)+`"`),
		filters.NewRegexMatch("DstK8S_Type", `"","Service"`),
		filters.NewRegexMatch("srcns", "a"),
		filters.NewRegexMatch("dstns", "b"),
	}, res[1])
}

func TestExpand_ComplexQuery(t *testing.T) {
	mq := filters.MultiQueries{
		filters.SingleQuery{filters.NewRegexMatch("key1", "a"), filters.NewRegexMatch("FlowDirection", string(constants.Ingress))},
		filters.SingleQuery{filters.NewRegexMatch("key1", "a"), filters.NewRegexMatch("key2", "b")},
		filters.SingleQuery{filters.NewRegexMatch("prom-handled", "a")},
		filters.SingleQuery{filters.NewRegexMatch("key1", "c"), filters.NewRegexMatch("key2", "d")},
	}
	res := expandQueries(mq, "my-namespace", func(q filters.SingleQuery) bool { return q[0].Key == "prom-handled" })

	assert.Len(t, res, 11)
	// First is unchanged for reporters, because FlowDirection is forced, but namespaces are injected
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("SrcK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("key1", "a"),
		filters.NewRegexMatch("FlowDirection", string(constants.Ingress)),
	}, res[0])
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("DstK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("key1", "a"),
		filters.NewRegexMatch("FlowDirection", string(constants.Ingress)),
	}, res[1])
	// Second is expanded into 3rd+4th+5th+6th
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("SrcK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Ingress)+`","`+string(constants.Inner)+`"`),
		filters.NewRegexMatch("key1", "a"),
		filters.NewRegexMatch("key2", "b"),
	}, res[2])
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("DstK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Ingress)+`","`+string(constants.Inner)+`"`),
		filters.NewRegexMatch("key1", "a"),
		filters.NewRegexMatch("key2", "b"),
	}, res[3])
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("SrcK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Egress)+`"`),
		filters.NewRegexMatch("DstK8S_Type", `"","Service"`),
		filters.NewRegexMatch("key1", "a"),
		filters.NewRegexMatch("key2", "b"),
	}, res[4])
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("DstK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Egress)+`"`),
		filters.NewRegexMatch("DstK8S_Type", `"","Service"`),
		filters.NewRegexMatch("key1", "a"),
		filters.NewRegexMatch("key2", "b"),
	}, res[5])
	// Third is unchanged, because it's prom-handled
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("prom-handled", "a"),
	}, res[6])
	// Fourth is expanded into 8th+9th+10th+11th
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("SrcK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Ingress)+`","`+string(constants.Inner)+`"`),
		filters.NewRegexMatch("key1", "c"),
		filters.NewRegexMatch("key2", "d"),
	}, res[7])
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("DstK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Ingress)+`","`+string(constants.Inner)+`"`),
		filters.NewRegexMatch("key1", "c"),
		filters.NewRegexMatch("key2", "d"),
	}, res[8])
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("SrcK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Egress)+`"`),
		filters.NewRegexMatch("DstK8S_Type", `"","Service"`),
		filters.NewRegexMatch("key1", "c"),
		filters.NewRegexMatch("key2", "d"),
	}, res[9])
	assert.Equal(t, filters.SingleQuery{
		filters.NewRegexMatch("DstK8S_Namespace", `"my-namespace"`),
		filters.NewRegexMatch("FlowDirection", `"`+string(constants.Egress)+`"`),
		filters.NewRegexMatch("DstK8S_Type", `"","Service"`),
		filters.NewRegexMatch("key1", "c"),
		filters.NewRegexMatch("key2", "d"),
	}, res[10])
}
