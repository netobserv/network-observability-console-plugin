package model

import (
	"fmt"
	"strconv"
)

type LokiQuery struct {
	Query string
	Limit int
	Start int64
	End   int64
}

// TODO: unclear yet if all this model is useful. Currently unused, as this is done on the frontend side
type LokiStreamResponse struct {
	ResultType string       `json:"resultType"`
	Result     StreamResult `json:"result"`
	Stats      LokiStats    `json:"stats"`
}

type LokiStats struct {
}

type StreamResult struct {
	Stream map[string]string `json:"stream"`
	Values [][]string        `json:"values"`
}

type ParsedStream struct {
	Labels map[string]string   `json:"labels"`
	Values []ParsedStreamValue `json:"values"`
}

type ParsedStreamValue struct {
	Timestamp int64  `json:"timestamp"`
	Blob      string `json:"blob"` // TODO: expand to IPFIX fields
}

func (in *StreamResult) Parse() (*ParsedStream, error) {
	parsedValues := []ParsedStreamValue{}
	for _, v := range in.Values {
		if len(v) < 2 {
			return nil, fmt.Errorf("parsing Loki result failed, unexpected stream values length: %v", v)
		}
		timestamp, err := strconv.ParseInt(v[0], 10, 64)
		if err != nil {
			return nil, fmt.Errorf("parsing Loki result failed, invalid timestamp [%s]: %v", v[0], err)
		}
		parsedValues = append(parsedValues, ParsedStreamValue{
			Timestamp: timestamp,
			Blob:      v[1],
		})
	}
	return &ParsedStream{
		Labels: in.Stream,
		Values: parsedValues,
	}, nil
}
