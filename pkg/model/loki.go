package model

import (
	"fmt"
	"strconv"
	"time"

	json "github.com/json-iterator/go"
	"github.com/prometheus/common/model"
)

// QueryResponse represents the http json response to a logQL query
type QueryResponse struct {
	Status string            `json:"status"`
	Data   QueryResponseData `json:"data"`
}

// AggregatedQueryResponse represents the modified json response to one or more logQL queries
type AggregatedQueryResponse struct {
	ResultType    ResultType      `json:"resultType"`
	Result        ResultValue     `json:"result"`
	Stats         AggregatedStats `json:"stats"`
	IsMock        bool            `json:"isMock"`
	UnixTimestamp int64           `json:"unixTimestamp"`
}

// AggregatedStats represents the stats to one or more logQL queries
type AggregatedStats struct {
	NumQueries   int           `json:"numQueries"`
	LimitReached bool          `json:"limitReached"`
	QueriesStats []interface{} `json:"queriesStats"`
}

// ResultType holds the type of the result
type ResultType string

// ResultType values
const (
	ResultTypeStream = "streams"
	ResultTypeScalar = "scalar"
	ResultTypeVector = "vector"
	ResultTypeMatrix = "matrix"
)

// ResultValue interface mimics the promql.Value interface
type ResultValue interface {
	Type() ResultType
}

// QueryResponseData represents the http json response to a label query
type QueryResponseData struct {
	ResultType ResultType  `json:"resultType"`
	Result     ResultValue `json:"result"`
	Stats      interface{} `json:"-"`
}

// Type implements the promql.Value interface
func (Streams) Type() ResultType { return ResultTypeStream }

// Type implements the promql.Value interface
func (Scalar) Type() ResultType { return ResultTypeScalar }

// Type implements the promql.Value interface
func (Vector) Type() ResultType { return ResultTypeVector }

// Type implements the promql.Value interface
func (Matrix) Type() ResultType { return ResultTypeMatrix }

// Streams is a slice of Stream
type Streams []Stream

// Stream represents a log stream.  It includes a set of log entries and their labels.
type Stream struct {
	Labels  map[string]string `json:"stream"`
	Entries []Entry           `json:"values"`
}

// Entry represents a log entry.  It includes a log message and the time it occurred at.
type Entry struct {
	Timestamp time.Time
	Line      string
}

// UnmarshalJSON implements the json.Unmarshaler interface.
func (q *QueryResponseData) UnmarshalJSON(data []byte) error {
	t, result, stats, err := unmarshalQueryResponseData(data)
	if err != nil {
		return err
	}
	q.ResultType = t
	q.Result = result
	q.Stats = stats

	return nil
}

// UnmarshalJSON implements the json.Unmarshaler interface.
func (q *AggregatedQueryResponse) UnmarshalJSON(data []byte) error {
	t, result, _, err := unmarshalQueryResponseData(data)
	if err != nil {
		return err
	}
	q.ResultType = t
	q.Result = result

	return nil
}

func unmarshalQueryResponseData(data []byte) (ResultType, ResultValue, interface{}, error) {
	unmarshal := struct {
		Type   ResultType      `json:"resultType"`
		Result json.RawMessage `json:"result"`
		Stats  interface{}     `json:"stats"`
	}{}

	err := json.Unmarshal(data, &unmarshal)
	if err != nil {
		return "", nil, nil, err
	}

	var value ResultValue

	// unmarshal results
	switch unmarshal.Type {
	case ResultTypeStream:
		var s Streams
		err = json.Unmarshal(unmarshal.Result, &s)
		value = s
	case ResultTypeMatrix:
		var m Matrix
		err = json.Unmarshal(unmarshal.Result, &m)
		value = m
	case ResultTypeVector:
		var v Vector
		err = json.Unmarshal(unmarshal.Result, &v)
		value = v
	case ResultTypeScalar:
		var v Scalar
		err = json.Unmarshal(unmarshal.Result, &v)
		value = v
	default:
		return "", nil, nil, fmt.Errorf("unknown type: %s", unmarshal.Type)
	}

	if err != nil {
		return "", nil, nil, err
	}

	return unmarshal.Type, value, unmarshal.Stats, nil
}

// MarshalJSON implements the json.Marshaler interface.
func (e *Entry) MarshalJSON() ([]byte, error) {
	l, err := json.Marshal(e.Line)
	if err != nil {
		return nil, err
	}
	return []byte(fmt.Sprintf("[\"%d\",%s]", e.Timestamp.UnixNano(), l)), nil
}

// UnmarshalJSON implements the json.Unmarshaler interface.
func (e *Entry) UnmarshalJSON(data []byte) error {
	var unmarshal []string

	err := json.Unmarshal(data, &unmarshal)
	if err != nil {
		return err
	}

	t, err := strconv.ParseInt(unmarshal[0], 10, 64)
	if err != nil {
		return err
	}

	e.Timestamp = time.Unix(0, t)
	e.Line = unmarshal[1]

	return nil
}

// Scalar is a single timestamp/float with no labels
type Scalar model.Scalar

func (s Scalar) MarshalJSON() ([]byte, error) {
	return model.Scalar(s).MarshalJSON()
}

func (s *Scalar) UnmarshalJSON(b []byte) error {
	var v model.Scalar
	if err := v.UnmarshalJSON(b); err != nil {
		return err
	}
	*s = Scalar(v)
	return nil
}

// Vector is a slice of Samples
type Vector []model.Sample

// Matrix is a slice of SampleStreams
type Matrix []model.SampleStream

// LabelValuesResponse represents the http json response to a query for label values
type LabelValuesResponse struct {
	Status string   `json:"status"`
	Data   []string `json:"data"`
}
