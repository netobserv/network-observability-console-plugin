package loki

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

func TestStreamsMerge(t *testing.T) {
	now := time.Now()
	merger := NewStreamMerger()
	baseline := model.Stream{
		Labels: map[string]string{
			"foo": "bar",
		},
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value}",
		}},
	}
	merger.AddStreams(model.Streams{baseline})

	// Different label, different line => no dedup
	merged := merger.AddStreams(model.Streams{{
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
	}})
	assert.Len(t, merged, 2)
	assert.Len(t, merged[0].Entries, 2)
	assert.Len(t, merged[1].Entries, 1)

	// Same labels in different order => no dedup
	merged = merger.AddStreams(model.Streams{{
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
	}})
	assert.Len(t, merged, 2)
	assert.Len(t, merged[0].Entries, 2)
	assert.Len(t, merged[1].Entries, 1)

	// Different timestamp => no dedup
	merged = merger.AddStreams(model.Streams{{
		Labels: baseline.Labels,
		Entries: []model.Entry{{
			Timestamp: now.Add(time.Hour),
			Line:      "{key: value}",
		}},
	}})
	assert.Len(t, merged, 2)
	assert.Len(t, merged[0].Entries, 3)
	assert.Len(t, merged[1].Entries, 1)

	// some dedup
	merged = merger.AddStreams(model.Streams{{
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
	})

	// Different timestamp => no dedup
	assert.Len(t, merged, 2)
	assert.Len(t, merged[0].Entries, 5)
	assert.Len(t, merged[1].Entries, 1)
}
