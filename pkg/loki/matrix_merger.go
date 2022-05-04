package loki

import (
	"fmt"

	pmodel "github.com/prometheus/common/model"

	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

//MatrixMerger stores a state to build unique Matrix from multiple ones
type MatrixMerger struct {
	Merger
	index        map[string]indexedSampleStream
	merged       model.Matrix
	stats        []interface{}
	numQueries   int
	reqLimit     int
	limitReached bool
}

func NewMatrixMerger(reqLimit int) *MatrixMerger {
	return &MatrixMerger{
		reqLimit: reqLimit,
		index:    map[string]indexedSampleStream{},
		merged:   model.Matrix{},
		stats:    []interface{}{},
	}
}

//indexedSampleStream stores a unique SampleStream at a specific index with merged values
type indexedSampleStream struct {
	sampleStream pmodel.SampleStream
	values       map[string]interface{}
	index        int
}

func (m *MatrixMerger) Add(from model.QueryResponseData) (model.ResultValue, error) {
	matrix, ok := from.Result.(model.Matrix)
	if !ok {
		return nil, fmt.Errorf("loki returned an unexpected type for MatrixMerger: %T", from)
	}

	m.numQueries++
	m.stats = append(m.stats, from.Stats)
	// In Matrix results, the limit stands for the "topk" value, which relates to the number of streams
	//	(ie LabelSet cardinality)
	if len(matrix) >= m.reqLimit {
		m.limitReached = true
	}
	for _, sampleStream := range matrix {
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
	return m.merged, nil
}

func (m *MatrixMerger) Get() *model.AggregatedQueryResponse {
	return &model.AggregatedQueryResponse{
		ResultType: model.ResultTypeMatrix,
		Result:     m.merged,
		Stats: model.AggregatedStats{
			NumQueries:   m.numQueries,
			LimitReached: m.limitReached,
			QueriesStats: m.stats,
		},
	}
}
