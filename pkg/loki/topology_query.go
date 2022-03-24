package loki

import (
	"fmt"
	"strconv"
	"time"
)

const (
	topologyDefaultLimit = "100"
	topologyDefaultRange = "300"
	topologyMetrics      = "SrcK8S_Name,SrcK8S_Type,SrcK8S_OwnerName,SrcK8S_OwnerType,SrcK8S_Namespace,SrcAddr,DstK8S_Name,DstK8S_Type,DstK8S_OwnerName,DstK8S_OwnerType,DstK8S_Namespace,DstAddr"
)

type Topology struct {
	limit     string
	startTime string
	endTime   string
	timeRange string
	function  string
	dataField string
}

type TopologyQueryBuilder struct {
	*Query
	topology *Topology
}

func NewTopologyQuery(baseURL string, labels []string) *TopologyQueryBuilder {
	return &TopologyQueryBuilder{
		Query:    NewQuery(baseURL, labels, false),
		topology: &Topology{},
	}
}

func (q *TopologyQueryBuilder) AddParams(params map[string][]string) error {
	for key, values := range params {
		if len(values) == 0 {
			// Silently ignore
			continue
		}

		// Note: empty string allowed
		if err := q.AddParam(key, values[0]); err != nil {
			return err
		}
	}
	return nil
}

func (q *TopologyQueryBuilder) AddParam(key, value string) error {
	if !filterRegexpValidation.MatchString(value) {
		return fmt.Errorf("unauthorized sign in flows request: %s", value)
	}
	switch key {
	case startTimeKey:
		q.topology.startTime = value
	case endTimeTimeKey:
		q.topology.endTime = value
	case timeRangeKey:
		start, err := timeRangeToStart(value)
		if err != nil {
			return err
		}
		q.topology.startTime = start
		return q.addParamTime(value)
	case limitKey:
		q.topology.limit = value
	default:
		return q.Query.AddParam(key, value)
	}
	return nil
}

func timeRangeToStart(value string) (string, error) {
	r, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return "", err
	}
	return strconv.FormatInt(time.Now().Unix()-r, 10), nil
}

// PrepareToSubmit returns a new TopologyQueryBuilder that already handles the special behavior of some attributes
// that mustn't be used as part of a generic query.
func (q *TopologyQueryBuilder) PrepareToSubmit() (*TopologyQueryBuilder, error) {
	newQuery, err := q.Query.PrepareToSubmit()
	if err != nil {
		return nil, err
	}
	return &TopologyQueryBuilder{
		Query:    newQuery,
		topology: q.topology,
	}, nil
}

func (q *TopologyQueryBuilder) URLQuery() (string, error) {
	endpoint, mainPart, jsonPart, params := q.urlQueryParts()
	err := q.setTopologyParams()
	if err != nil {
		return "", err
	}

	if len(jsonPart) > 0 {
		jsonPart = "|" + jsonPart
	}
	return endpoint + fmt.Sprintf(`topk(%s,sum by(%s) (%s(%s|json%s|unwrap %s|__error__=""[%ss])))%s&step=%ss`,
		q.topology.limit, topologyMetrics, q.topology.function, mainPart, jsonPart, q.topology.dataField, q.topology.timeRange, params, q.topology.timeRange), nil
}

func (q *TopologyQueryBuilder) setTopologyParams() error {
	if len(q.topology.timeRange) == 0 {
		var startTime, endTime int64
		var err error
		for _, p := range q.urlParams {
			switch p[0] {
			case startParam:
				startTime, err = strconv.ParseInt(p[1], 10, 64)
			case endParam:
				endTime, err = strconv.ParseInt(p[1], 10, 64)
			}
			if err != nil {
				return fmt.Errorf("%s param should be int64", p[0])
			}
		}
		rng := endTime - startTime
		if rng > 0 {
			q.topology.timeRange = strconv.FormatInt(rng, 10)
		} else {
			q.topology.timeRange = topologyDefaultRange
		}
	}

	if len(q.topology.limit) == 0 {
		q.topology.limit = topologyDefaultLimit
	}

	//TODO: allow rate / sum_over_time / avg_over_time / max_over_time / min_over_time
	q.topology.function = "sum_over_time"
	//TODO: allow other values than bytes like Packets
	q.topology.dataField = "Bytes"

	return nil
}
