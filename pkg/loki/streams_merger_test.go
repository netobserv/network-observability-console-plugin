package loki

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

func qrData(result model.ResultValue) model.QueryResponseData {
	return model.QueryResponseData{Result: result}
}

func TestStreamsMerge(t *testing.T) {
	now := time.Now()
	merger := NewStreamMerger(100)
	baseline := model.Stream{
		Labels: map[string]string{
			"foo": "bar",
		},
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value}",
		}},
	}
	_, err := merger.Add(qrData(model.Streams{baseline}))
	require.NoError(t, err)

	// Different label, different line => no dedup
	merged, err := merger.Add(qrData(model.Streams{{
		Labels: map[string]string{
			"foo":  "bar",
			"foo2": "bar2",
		},
		Entries: baseline.Entries,
	}, {
		Labels: baseline.Labels,
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key2: value2}",
		}},
	}}))
	require.NoError(t, err)
	assert.Len(t, merged, 2)
	assert.Len(t, merged.(model.Streams)[0].Entries, 2)
	assert.Len(t, merged.(model.Streams)[1].Entries, 1)

	// Same labels in different order => no dedup
	merged, err = merger.Add(qrData(model.Streams{{
		Labels: map[string]string{
			"foo2": "bar2",
			"foo":  "bar",
		},
		Entries: baseline.Entries,
	}, {
		Labels: map[string]string{
			"foo2": "bar2",
			"foo":  "bar",
		},
		Entries: baseline.Entries,
	}, {
		Labels: map[string]string{
			"foo":  "bar",
			"foo2": "bar2",
		},
		Entries: baseline.Entries,
	}}))
	require.NoError(t, err)
	assert.Len(t, merged, 2)
	assert.Len(t, merged.(model.Streams)[0].Entries, 2)
	assert.Len(t, merged.(model.Streams)[1].Entries, 1)

	// Different timestamp => no dedup
	merged, err = merger.Add(qrData(model.Streams{{
		Labels: baseline.Labels,
		Entries: []model.Entry{{
			Timestamp: now.Add(time.Hour),
			Line:      "{key: value}",
		}},
	}}))
	require.NoError(t, err)
	assert.Len(t, merged, 2)
	assert.Len(t, merged.(model.Streams)[0].Entries, 3)
	assert.Len(t, merged.(model.Streams)[1].Entries, 1)

	// some dedup
	merged, err = merger.Add(qrData(model.Streams{{
		// changed line => no dedup
		Labels: baseline.Labels,
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value3}",
		}},
	}, {
		// changed line => no dedup
		Labels: baseline.Labels,
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{}",
		}},
	}, {
		// same as previously modified timestamp => must be ignored
		Labels: baseline.Labels,
		Entries: []model.Entry{{
			Timestamp: now.Add(time.Hour),
			Line:      "{key: value}",
		}},
	},
		// baseline itself => must be ignored
		baseline,
	}))

	// Different timestamp => no dedup
	require.NoError(t, err)
	assert.Len(t, merged, 2)
	assert.Len(t, merged.(model.Streams)[0].Entries, 5)
	assert.Len(t, merged.(model.Streams)[1].Entries, 1)
}

func TestStreamsLimitReached(t *testing.T) {
	now := time.Now()
	merger := NewStreamMerger(2)

	// Single entry => should not reach limit
	first := model.Stream{
		Labels: map[string]string{
			"foo": "bar",
		},
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value}",
		}},
	}
	_, err := merger.Add(qrData(model.Streams{first}))
	require.NoError(t, err)
	assert.False(t, merger.limitReached)

	// Another single entry => limit still not reached (even if total is 2)
	_, err = merger.Add(qrData(model.Streams{{
		Labels: map[string]string{
			"foo": "bar",
		},
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value}",
		}},
	}}))
	require.NoError(t, err)
	assert.False(t, merger.limitReached)

	// 2 entries => limit reached
	_, err = merger.Add(qrData(model.Streams{{
		// changed line => no dedup
		Labels: first.Labels,
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value3}",
		}},
	}, {
		// same as first => dedup, but still counts for limit reached
		Labels: first.Labels,
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value}",
		}},
	},
	}))
	require.NoError(t, err)
	assert.True(t, merger.limitReached)

	// Another single entry => limit still reached
	_, err = merger.Add(qrData(model.Streams{{
		Labels: map[string]string{
			"foo": "bar",
		},
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value}",
		}},
	}}))
	require.NoError(t, err)
	assert.True(t, merger.limitReached)
}
