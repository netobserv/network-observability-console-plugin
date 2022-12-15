package model

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestQueryResponseMarshal(t *testing.T) {
	qr := QueryResponse{
		Data: QueryResponseData{
			ResultType: ResultTypeStream,
			Result:     Streams{},
		},
	}

	js, err := json.Marshal(qr)
	require.NoError(t, err)
	assert.Equal(t, `{"status":"","data":{"resultType":"streams","result":[]}}`, string(js))
}

func TestQueryResponseUnmarshal(t *testing.T) {
	js := `{"status":"","data":{"resultType":"streams","result":[]}}`
	var qr QueryResponse
	err := json.Unmarshal([]byte(js), &qr)
	require.NoError(t, err)
	assert.Equal(t, ResultTypeStream, string(qr.Data.ResultType))
	assert.NotNil(t, qr.Data.Result)
	assert.Empty(t, qr.Data.Result)
	var expType Streams
	assert.IsType(t, expType, qr.Data.Result)
}

func TestAggregatedQueryResponseMarshal(t *testing.T) {
	qr := AggregatedQueryResponse{
		ResultType: ResultTypeStream,
		Result:     Streams{},
		Stats: AggregatedStats{
			NumQueries: 1,
		},
	}

	js, err := json.Marshal(qr)
	require.NoError(t, err)
	assert.Equal(t, `{"resultType":"streams","result":[],"stats":{"numQueries":1,"limitReached":false,"queriesStats":null},"isMock":false,"unixTimestamp":0}`, string(js))
}

func TestAggregatedQueryResponseUnmarshal(t *testing.T) {
	js := `{"resultType":"streams","result":[],"stats":{"numQueries":1,"limitReached":false,"queriesStats":null},"isMock":false,"unixTimestamp":0}`
	var qr AggregatedQueryResponse
	err := json.Unmarshal([]byte(js), &qr)
	require.NoError(t, err)
	assert.Equal(t, ResultTypeStream, string(qr.ResultType))
	assert.NotNil(t, qr.Result)
	assert.Empty(t, qr.Result)
	var expType Streams
	assert.IsType(t, expType, qr.Result)
}

func TestQueryResponseMatrixMarshal(t *testing.T) {
	qr := QueryResponse{
		Data: QueryResponseData{
			ResultType: ResultTypeMatrix,
			Result:     Matrix{},
		},
	}

	js, err := json.Marshal(qr)
	require.NoError(t, err)
	assert.Equal(t, `{"status":"","data":{"resultType":"matrix","result":[]}}`, string(js))
}

func TestQueryResponseMatrixUnmarshal(t *testing.T) {
	js := `{"status":"","data":{"resultType":"matrix","result":[]}}`
	var qr QueryResponse
	err := json.Unmarshal([]byte(js), &qr)
	require.NoError(t, err)
	assert.Equal(t, ResultTypeMatrix, string(qr.Data.ResultType))
	assert.NotNil(t, qr.Data.Result)
	assert.Empty(t, qr.Data.Result)
	var expType Matrix
	assert.IsType(t, expType, qr.Data.Result)
}

func TestAggregatedQueryResponseMatrixMarshal(t *testing.T) {
	qr := AggregatedQueryResponse{
		ResultType: ResultTypeMatrix,
		Result:     Matrix{},
		Stats: AggregatedStats{
			NumQueries: 1,
		},
	}

	js, err := json.Marshal(qr)
	require.NoError(t, err)
	assert.Equal(t, `{"resultType":"matrix","result":[],"stats":{"numQueries":1,"limitReached":false,"queriesStats":null},"isMock":false,"unixTimestamp":0}`, string(js))
}

func TestAggregatedQueryResponseMatrixUnmarshal(t *testing.T) {
	js := `{"resultType":"matrix","result":[],"stats":{"numQueries":1,"limitReached":false,"queriesStats":null},"isMock":false,"unixTimestamp":0}`
	var qr AggregatedQueryResponse
	err := json.Unmarshal([]byte(js), &qr)
	require.NoError(t, err)
	assert.Equal(t, ResultTypeMatrix, string(qr.ResultType))
	assert.NotNil(t, qr.Result)
	assert.Empty(t, qr.Result)
	var expType Matrix
	assert.IsType(t, expType, qr.Result)
}

func TestReencodeStats(t *testing.T) {
	js := `{"status":"","data":{"resultType":"streams","result":[],"stats":{"ingester":{"foo":"bar"}}}}`
	var qr QueryResponse
	err := json.Unmarshal([]byte(js), &qr)
	require.NoError(t, err)
	agg := AggregatedQueryResponse{
		ResultType: qr.Data.ResultType,
		Result:     qr.Data.Result,
		Stats: AggregatedStats{
			NumQueries:   1,
			LimitReached: false,
			QueriesStats: []interface{}{qr.Data.Stats},
		},
	}
	reencoded, err := json.Marshal(agg)
	require.NoError(t, err)
	assert.Equal(t, `{"resultType":"streams","result":[],"stats":{"numQueries":1,"limitReached":false,"queriesStats":[{"ingester":{"foo":"bar"}}]},"isMock":false,"unixTimestamp":0}`, string(reencoded))
}
