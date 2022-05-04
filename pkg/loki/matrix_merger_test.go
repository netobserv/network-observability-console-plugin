package loki

import (
	"testing"
	"time"

	pmodel "github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

func TestMatrixMerge(t *testing.T) {
	now := pmodel.Now()
	merger := NewMatrixMerger(100)
	baseline := pmodel.SampleStream{
		Metric: pmodel.Metric{
			"foo": "bar",
		},
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(42),
		}},
	}
	_, err := merger.Add(qrData(model.Matrix{baseline}))
	require.NoError(t, err)

	// Different metric, different value pair => no dedup
	merged, err := merger.Add(qrData(model.Matrix{{
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
	}}))
	require.NoError(t, err)
	assert.Len(t, merged, 2)
	assert.Len(t, merged.(model.Matrix)[0].Values, 2)
	assert.Len(t, merged.(model.Matrix)[1].Values, 1)

	// Same metrics in different order => no dedup
	merged, err = merger.Add(qrData(model.Matrix{{
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
	}}))
	require.NoError(t, err)
	assert.Len(t, merged, 2)
	assert.Len(t, merged.(model.Matrix)[0].Values, 2)
	assert.Len(t, merged.(model.Matrix)[1].Values, 1)

	// Different timestamp => no dedup
	merged, err = merger.Add(qrData(model.Matrix{{
		Metric: baseline.Metric,
		Values: []pmodel.SamplePair{{
			Timestamp: now.Add(time.Hour),
			Value:     pmodel.SampleValue(12),
		}},
	}}))
	require.NoError(t, err)
	assert.Len(t, merged, 2)
	assert.Len(t, merged.(model.Matrix)[0].Values, 3)
	assert.Len(t, merged.(model.Matrix)[1].Values, 1)

	// some dedup
	merged, err = merger.Add(qrData(model.Matrix{{
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
	}))

	// Different timestamp
	require.NoError(t, err)
	assert.Len(t, merged, 2)
	assert.Len(t, merged.(model.Matrix)[0].Values, 6)
	assert.Len(t, merged.(model.Matrix)[1].Values, 1)
}

func TestMatrixLimitReached(t *testing.T) {
	now := pmodel.Now()
	merger := NewMatrixMerger(2)

	// Single entry => should not reach limit
	first := pmodel.SampleStream{
		Metric: pmodel.Metric{
			"foo": "bar",
		},
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(42),
		}},
	}
	_, err := merger.Add(qrData(model.Matrix{first}))
	require.NoError(t, err)
	assert.False(t, merger.limitReached)

	// Another single entry => limit still not reached (even if total is 2)
	_, err = merger.Add(qrData(model.Matrix{pmodel.SampleStream{
		Metric: pmodel.Metric{
			"foo": "bar",
		},
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(42),
		}},
	}}))
	require.NoError(t, err)
	assert.False(t, merger.limitReached)

	// 2 entries => limit reached
	_, err = merger.Add(qrData(model.Matrix{pmodel.SampleStream{
		Metric: pmodel.Metric{
			"foo": "bar",
		},
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(42),
		}},
	}, pmodel.SampleStream{
		Metric: pmodel.Metric{
			"foo": "baz",
		},
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(42),
		}},
	}}))
	require.NoError(t, err)
	assert.True(t, merger.limitReached)

	// Another single entry => limit still reached
	_, err = merger.Add(qrData(model.Matrix{pmodel.SampleStream{
		Metric: pmodel.Metric{
			"foo": "bar",
		},
		Values: []pmodel.SamplePair{{
			Timestamp: now,
			Value:     pmodel.SampleValue(42),
		}},
	}}))
	require.NoError(t, err)
	assert.True(t, merger.limitReached)
}
