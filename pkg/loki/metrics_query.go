package loki

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

const (
	metricsDefaultLimit = "100"
	metricsDefaultStep  = "60"
	metricsDefaultRange = "300"
)

type Metrics struct {
	limit          string
	step           string
	timeRange      string
	metricFunction string
	dataField      string
	fields         string
}

type MetricsQueryBuilder struct {
	*FlowQueryBuilder
	metrics *Metrics
}

func NewMetricsQuery(cfg *Config, start, end, limit, step, metricFunction, metricType, reporter, layer, scope, groups string) (*MetricsQueryBuilder, error) {
	l := limit
	if len(l) == 0 {
		l = metricsDefaultLimit
	}

	s := step
	if len(s) == 0 {
		s = metricsDefaultStep
	}

	timeRange := metricsDefaultRange
	if len(start) > 0 && len(end) > 0 {
		var startTime, endTime int64
		var err error
		startTime, err = strconv.ParseInt(start, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("can't parse start param: %s", start)
		}
		endTime, err = strconv.ParseInt(end, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("can't parse end param: %s", end)
		}
		rng := endTime - startTime
		if rng > 0 {
			timeRange = strconv.FormatInt(rng, 10)
		}
	}

	var f string
	switch metricFunction {
	case "avg":
		f = "avg_over_time"
	case "max":
		f = "max_over_time"
	case "rate":
		f = "rate"
	default:
		f = "sum_over_time"
	}

	var t string
	switch metricType {
	case "packets":
		t = "Packets"
	default:
		t = "Bytes"
	}

	return &MetricsQueryBuilder{
		FlowQueryBuilder: NewFlowQueryBuilder(cfg, start, end, limit, reporter, layer),
		metrics: &Metrics{
			timeRange:      timeRange,
			limit:          l,
			step:           s,
			metricFunction: f,
			dataField:      t,
			fields:         getFields(scope, groups),
		},
	}, nil
}

func getFields(scope, groups string) string {
	var fields []string
	switch scope {
	case "app":
		fields = []string{"app"}
	case "host":
		fields = []string{"SrcK8S_HostName", "DstK8S_HostName"}
	case "namespace":
		fields = []string{"SrcK8S_Namespace", "DstK8S_Namespace"}
	case "owner":
		fields = []string{"SrcK8S_OwnerName", "SrcK8S_OwnerType", "DstK8S_OwnerName", "DstK8S_OwnerType"}
	default:
		fields = []string{"SrcK8S_Name", "SrcK8S_Type", "SrcK8S_OwnerName", "SrcK8S_OwnerType", "SrcK8S_Namespace", "SrcAddr", "SrcK8S_HostName", "DstK8S_Name", "DstK8S_Type", "DstK8S_OwnerName", "DstK8S_OwnerType", "DstK8S_Namespace", "DstAddr", "DstK8S_HostName"}
	}

	if len(groups) > 0 {
		if strings.Contains(groups, "hosts") {
			if !utils.Contains(fields, "SrcK8S_HostName") {
				fields = append(fields, "SrcK8S_HostName", "DstK8S_HostName")
			}
		}

		if strings.Contains(groups, "namespaces") {
			if !utils.Contains(fields, "SrcK8S_Namespace") {
				fields = append(fields, "SrcK8S_Namespace", "DstK8S_Namespace")
			}
		}

		if strings.Contains(groups, "owners") {
			if !utils.Contains(fields, "SrcK8S_OwnerName") {
				fields = append(fields, "SrcK8S_OwnerName", "SrcK8S_OwnerType", "DstK8S_OwnerName", "DstK8S_OwnerType")
			}
		}
	}

	return strings.Join(fields[:], ",")
}

func (q *MetricsQueryBuilder) Build() string {
	// Build metrics query like:
	// /<url path>?query=
	//		topk(
	// 			<k>,
	//			sum by(<aggregations>) (
	//				sum_over_time(
	//					{<label filters>}|<line filters>|json|<json filters>
	//						|unwrap Bytes[300s]
	//				)
	//			)
	//		)
	//		&<query params>&step=300s
	sb := q.createStringBuilderURL()
	sb.WriteString("topk(")
	sb.WriteString(q.metrics.limit)
	sb.WriteString(",sum by(")
	sb.WriteString(q.metrics.fields)
	sb.WriteString(") (")
	sb.WriteString(q.metrics.metricFunction)
	sb.WriteString("(")
	q.appendLabels(sb)
	q.appendLineFilters(sb)
	q.appendJSON(sb, true)
	if q.metrics.metricFunction != "rate" && len(q.metrics.dataField) > 0 {
		sb.WriteString("|unwrap ")
		sb.WriteString(q.metrics.dataField)
	}
	sb.WriteRune('[')
	sb.WriteString(q.metrics.timeRange)
	sb.WriteString("s])))")
	q.appendQueryParams(sb)
	sb.WriteString("&step=")
	sb.WriteString(q.metrics.step)
	sb.WriteString("s")

	return sb.String()
}
