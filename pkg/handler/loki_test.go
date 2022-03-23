package handler

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

func TestMerge(t *testing.T) {
	now := time.Now()
	baseline := model.Stream{
		Labels: map[string]string{
			"foo": "bar",
		},
		Entries: []model.Entry{{
			Timestamp: now,
			Line:      "{key: value}",
		}},
	}
	aggStream := model.Streams{baseline}

	// Different label, different line => no dedup
	aggStream = merge(aggStream, model.Streams{{
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
	assert.Len(t, aggStream, 3)

	// Different timestamp => no dedup
	aggStream = merge(aggStream, model.Streams{{
		Labels: baseline.Labels,
		Entries: []model.Entry{{
			Timestamp: now.Add(time.Hour),
			Line:      "{key: value}",
		}},
	}})
	assert.Len(t, aggStream, 4)

	// some dedup
	aggStream = merge(aggStream, model.Streams{
		// changed line => no dedup
		{
			Labels: baseline.Labels,
			Entries: []model.Entry{{
				Timestamp: now,
				Line:      "{key: value3}",
			}},
		},
		// changed line => no dedup
		{
			Labels: baseline.Labels,
			Entries: []model.Entry{{
				Timestamp: now,
				Line:      "{}",
			}},
		},
		// same as previously modified timestamp => must be ignored
		{
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
	assert.Len(t, aggStream, 6)
}
