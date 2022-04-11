package loki

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	pmodel "github.com/prometheus/common/model"
)

func TestMatrixMerge(t *testing.T) {
	now := pmodel.Now()
	merger := NewMatrixMerger()
	baseline := pmodel.SampleStream{
		Metric: pmodel.Metric{
			"foo": "bar",
		},
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(42),
		}},
	}
	merger.AddMatrix(model.Matrix{baseline})

	// Different metric, different value pair => no dedup
	merged := merger.AddMatrix(model.Matrix{{
		Metric: pmodel.Metric{
			"foo":  "bar",
			"foo2": "bar2",
		},
		Values: baseline.Values,
	}, {
		Metric: baseline.Metric,
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(12),
		}},
	}})
	assert.Len(t, merged, 2)
	assert.Len(t, merged[0].Values, 2)
	assert.Len(t, merged[1].Values, 1)

	// Same metrics in different order => no dedup
	merged = merger.AddMatrix(model.Matrix{{
		Metric: pmodel.Metric{
			"foo2": "bar2",
			"foo":  "bar",
		},
		Values: baseline.Values,
	}, {
		Metric: pmodel.Metric{
			"foo2": "bar2",
			"foo":  "bar",
		},
		Values: baseline.Values,
	}, {
		Metric: pmodel.Metric{
			"foo":  "bar",
			"foo2": "bar2",
		},
		Values: baseline.Values,
	}})
	assert.Len(t, merged, 2)
	assert.Len(t, merged[0].Values, 2)
	assert.Len(t, merged[1].Values, 1)

	// Different timestamp => no dedup
	merged = merger.AddMatrix(model.Matrix{{
		Metric: baseline.Metric,
		Values: []pmodel.SamplePair{{
			Timestamp: now.Add(time.Hour),
			Value:     pmodel.SampleValue(12),
		}},
	}})
	assert.Len(t, merged, 2)
	assert.Len(t, merged[0].Values, 3)
	assert.Len(t, merged[1].Values, 1)

	// some dedup
	merged = merger.AddMatrix(model.Matrix{{
		// changed value => no dedup
		Metric: baseline.Metric,
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(8),
		}},
	}, {
		// changed value => no dedup
		Metric: baseline.Metric,
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(0),
		}},
	}, {
		// same as previously modified timestamp => will be added
		Metric: baseline.Metric,
		Values: []pmodel.SamplePair{{
			Timestamp: now.Add(time.Hour),
			Value:     pmodel.SampleValue(42),
		}},
	},
		// baseline itself => must be ignored
		baseline,
	})

	// Different timestamp
	assert.Len(t, merged, 2)
	assert.Len(t, merged[0].Values, 6)
	assert.Len(t, merged[1].Values, 1)
}
