package loki

import (
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	pmodel "github.com/prometheus/common/model"
)

//MatrixMerger stores a state to build unique Matrix from multiple ones
type MatrixMerger struct {
	index  map[string]indexedSampleStream
	merged model.Matrix
}

func NewMatrixMerger() *MatrixMerger {
	return &MatrixMerger{
		index:  map[string]indexedSampleStream{},
		merged: model.Matrix{},
	}
}

//indexedSampleStream stores a unique SampleStream at a specific index with merged values
type indexedSampleStream struct {
	sampleStream pmodel.SampleStream
	values       map[string]interface{}
	index        int
}

func (m *MatrixMerger) AddMatrix(from model.Matrix) model.Matrix {
	for _, sampleStream := range from {
		skey := sampleStream.Metric.String()
		idxSampleStream, sampleStreamExists := m.index[skey]
		if !sampleStreamExists {
			// SampleStream doesn't exist => create new index
			idxSampleStream = indexedSampleStream{
				sampleStream: sampleStream,
				values:       map[string]interface{}{},
				index:        len(m.index),
			}
		}
		// Merge content (values)
		for _, v := range sampleStream.Values {
			vkey := v.String()
			if _, valueExists := idxSampleStream.values[vkey]; !valueExists {
				// Add value to the existing sampleStream, and mark it as existing in idxSampleStream.values
				idxSampleStream.values[vkey] = nil
				if sampleStreamExists {
					idxSampleStream.sampleStream.Values = append(m.index[skey].sampleStream.Values, v)
				}
			} // Else: entry found => ignore duplicate
		}
		// Add or overwrite index
		m.index[skey] = idxSampleStream
		if !sampleStreamExists {
			// SampleStream doesn't exist => append it
			m.merged = append(m.merged, idxSampleStream.sampleStream)
		} else {
			m.merged[idxSampleStream.index] = idxSampleStream.sampleStream
		}
	}
	return m.merged
}

func (m *MatrixMerger) GetMatrix() model.Matrix {
	return m.merged
}
