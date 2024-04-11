package prometheus

import (
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
)

type QueryBuilder struct {
	in      *loki.TopologyInput
	filters filters.SingleQuery
	metric  string
	qRange  v1.Range
}

type Query struct {
	Range  v1.Range
	PromQL string
}

func NewQuery(in *loki.TopologyInput, qr *v1.Range, filters filters.SingleQuery, metric string) *QueryBuilder {
	return &QueryBuilder{
		in:      in,
		filters: filters,
		metric:  metric,
		qRange:  *qr,
	}
}

func (q *QueryBuilder) Build() Query {
	labels, extraFilter := loki.GetLabelsAndFilter(q.in.Aggregate, q.in.Groups)
	if extraFilter != "" {
		q.filters = append(q.filters, filters.NewNotMatch(extraFilter, `""`))
	}
	groupBy := strings.Join(labels, ",")

	var factor, quantile string
	isHisto := false
	switch q.in.DataField {
	case constants.MetricTypeFlowRTT, constants.MetricTypeDNSLatency:
		factor = "*1000" // seconds to milliseconds
		isHisto = true
	}
	if isHisto {
		if q.in.MetricFunction == constants.MetricFunctionP90 {
			quantile = "0.9"
		} else if q.in.MetricFunction == constants.MetricFunctionP99 {
			quantile = "0.99"
		}
	}

	// Build metrics query like:
	//		topk | bottomk(
	// 			<k>,
	//			sum by(<aggregations>) (
	//				<function>(
	//					<metric>{<filters>}[<interval>]
	//				) <factor>
	//			)
	//		)
	//		&<query params>&step=<step>
	sb := strings.Builder{}

	if q.in.Top != "" {
		if q.in.MetricFunction == constants.MetricFunctionMin {
			sb.WriteString("bottomk")
		} else {
			sb.WriteString("topk")
		}
		sb.WriteRune('(')
		sb.WriteString(q.in.Top)
		sb.WriteRune(',')
	}

	if isHisto && quantile != "" {
		// use histogram_quantile
		sb.WriteString("histogram_quantile(")
		sb.WriteString(quantile)
		sb.WriteRune(',')
		if groupBy == "" {
			groupBy = "le"
		} else {
			groupBy += ",le"
		}
	}

	sb.WriteString("sum by(")
	sb.WriteString(groupBy)
	sb.WriteRune(')')

	sb.WriteRune('(')
	if isHisto && quantile == "" {
		// histogram average: sum / count
		baseMetric := strings.TrimSuffix(q.metric, "_bucket")
		appendRate(&sb, baseMetric+"_sum", q.filters, q.in.RateInterval)
		sb.WriteRune('/')
		appendRate(&sb, baseMetric+"_count", q.filters, q.in.RateInterval)
	} else {
		appendRate(&sb, q.metric, q.filters, q.in.RateInterval)
	}
	sb.WriteRune(')')
	if isHisto && quantile != "" {
		sb.WriteRune(')')
	}

	if len(factor) > 0 {
		sb.WriteString(factor)
	}

	if q.in.Top != "" {
		sb.WriteRune(')')
	}

	return Query{
		PromQL: sb.String(),
		Range:  q.qRange,
	}
}

func appendRate(sb *strings.Builder, metric string, filters filters.SingleQuery, interval string) {
	sb.WriteString("rate(")
	sb.WriteString(metric)
	sb.WriteRune('{')
	first := true
	for _, filter := range filters {
		if lf, ok := filter.ToLabelFilter(); ok {
			if !first {
				sb.WriteRune(',')
			}
			lf.WriteInto(sb)
			first = false
		}
	}
	sb.WriteRune('}')
	sb.WriteRune('[')
	sb.WriteString(interval)
	sb.WriteString("])")
}
