package loki

import (
	"fmt"
	"slices"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

const (
	topologyDefaultLimit = "100"
)

var (
	aggregateKeyLabels = map[string][]string{
		"app":          {"app"},
		"droppedState": {"PktDropLatestState"},
		"droppedCause": {"PktDropLatestDropCause"},
		"dnsRCode":     {"DnsFlagsResponseCode"},
		"cluster":      {"K8S_ClusterName"},
		"zone":         {"SrcK8S_Zone", "DstK8S_Zone"},
		"host":         {"SrcK8S_HostName", "DstK8S_HostName"},
		"namespace":    {"SrcK8S_Namespace", "DstK8S_Namespace"},
		"owner":        {"SrcK8S_OwnerName", "SrcK8S_OwnerType", "DstK8S_OwnerName", "DstK8S_OwnerType", "SrcK8S_Namespace", "DstK8S_Namespace"},
		"resource":     {"SrcK8S_Name", "SrcK8S_Type", "SrcK8S_OwnerName", "SrcK8S_OwnerType", "SrcK8S_Namespace", "SrcAddr", "SrcK8S_HostName", "DstK8S_Name", "DstK8S_Type", "DstK8S_OwnerName", "DstK8S_OwnerType", "DstK8S_Namespace", "DstAddr", "DstK8S_HostName"},
	}
	groupKeyLabels = map[string][]string{
		"clusters":   {"K8S_ClusterName"},
		"udns":       {"UdnId"},
		"zones":      {"SrcK8S_Zone", "DstK8S_Zone"},
		"hosts":      {"SrcK8S_HostName", "DstK8S_HostName"},
		"namespaces": {"SrcK8S_Namespace", "DstK8S_Namespace"},
		"owners":     {"SrcK8S_OwnerName", "SrcK8S_OwnerType", "DstK8S_OwnerName", "DstK8S_OwnerType"},
	}
)

type TopologyInput struct {
	Start          string
	End            string
	Top            string
	RateInterval   string
	Step           string
	DataField      string
	MetricFunction constants.MetricFunction
	RecordType     constants.RecordType
	DataSource     constants.DataSource
	PacketLoss     constants.PacketLoss
	Aggregate      string
	Groups         string
	DedupMark      bool
}

type TopologyQueryBuilder struct {
	*FlowQueryBuilder
	topology *TopologyInput
}

func NewTopologyQuery(cfg *config.Loki, in *TopologyInput) (*TopologyQueryBuilder, error) {
	var dedup bool
	var rt constants.RecordType
	if slices.Contains(constants.AnyConnectionType, string(in.RecordType)) {
		dedup = false
		rt = "endConnection"
	} else {
		dedup = in.DedupMark
		rt = "flowLog"
	}

	fqb := NewFlowQueryBuilder(cfg, in.Start, in.End, in.Top, dedup, rt, in.PacketLoss)
	return &TopologyQueryBuilder{
		FlowQueryBuilder: fqb,
		topology:         in,
	}, nil
}

func GetLabelsAndFilter(aggregate, groups string) ([]string, string) {
	var fields []string
	var filter string
	if fields = aggregateKeyLabels[aggregate]; fields == nil {
		fields = []string{aggregate}
		filter = aggregate
	}
	if groups != "" {
		for gr, labels := range groupKeyLabels {
			if strings.Contains(groups, gr) {
				for _, label := range labels {
					if !slices.Contains(fields, label) {
						fields = append(fields, label)
					}
				}
			}
		}
	}
	return fields, filter
}

func getField(metricType string) string {
	switch metricType {
	case constants.MetricTypeFlows, constants.MetricTypeDNSFlows:
		return ""
	default:
		return metricType
	}
}

func getFactor(metricType string) string {
	switch metricType {
	case constants.MetricTypeFlowRTT:
		return "/1000000" // nanoseconds to milliseconds
	default:
		return ""
	}
}

func GetFunctionWithQuantile(metricFunction constants.MetricFunction) (string, string) {
	switch metricFunction {
	case constants.MetricFunctionCount:
		return "count_over_time", ""
	case constants.MetricFunctionSum:
		return "sum_over_time", ""
	case constants.MetricFunctionMax:
		return "max_over_time", ""
	case constants.MetricFunctionMin:
		return "min_over_time", ""
	case constants.MetricFunctionAvg:
		return "avg_over_time", ""
	case constants.MetricFunctionP90:
		return "quantile_over_time", "0.9"
	case constants.MetricFunctionP99:
		return "quantile_over_time", "0.99"
	case constants.MetricFunctionRate:
		return "rate", ""
	default:
		panic(fmt.Sprint("wrong function provided:", metricFunction))
	}
}

func (q *TopologyQueryBuilder) Build() string {
	top := q.topology.Top
	if top == "" {
		top = topologyDefaultLimit
	}

	labels, extraFilter := GetLabelsAndFilter(q.topology.Aggregate, q.topology.Groups)
	if q.config.IsLabel(extraFilter) {
		extraFilter = ""
	}
	strLabels := strings.Join(labels, ",")

	dataField := getField(q.topology.DataField)
	factor := getFactor(q.topology.DataField)
	function, quantile := GetFunctionWithQuantile(q.topology.MetricFunction)

	sumBy := function == "rate" || function == "count_over_time" || function == "sum_over_time"
	// Build topology query like:
	// /<url path>?query=
	//		topk | bottomk(
	// 			<k>,
	//			<sum | avg> by(<aggregations>) (
	//				<function>(
	//					{<label filters>}|<line filters>|json|<json filters>
	//						|unwrap Bytes|__error__=""[<interval>]
	//				) <factor>
	//			)
	//		)
	//		&<query params>&step=<step>
	sb := q.createStringBuilderURL()
	if function == "min_over_time" {
		sb.WriteString("bottomk")
	} else {
		sb.WriteString("topk")
	}
	sb.WriteRune('(')
	sb.WriteString(top)
	sb.WriteRune(',')

	if sumBy {
		sb.WriteString("sum by(")
		sb.WriteString(strLabels)
		sb.WriteRune(')')
	}

	sb.WriteRune('(')
	sb.WriteString(function)
	sb.WriteString("(")
	if len(quantile) > 0 {
		sb.WriteString(quantile)
		sb.WriteRune(',')
	}
	q.appendLabels(sb)
	q.appendLineFilters(sb)

	if len(extraFilter) > 0 {
		q.appendFilter(sb, extraFilter)
	}

	if dataField == constants.MetricTypeDNSLatency {
		q.appendDNSLatencyFilter(sb)
	} else if dataField == constants.MetricTypeDNSFlows {
		q.appendDNSFilter(sb)
	} else if dataField == constants.MetricTypeFlowRTT {
		q.appendRTTFilter(sb)
	}

	q.appendJSON(sb, true)
	if len(dataField) > 0 {
		sb.WriteString("|unwrap ")
		sb.WriteString(dataField)
		sb.WriteString(`|__error__=""`)
	}
	sb.WriteRune('[')
	if function != "rate" {
		sb.WriteString(q.topology.Step)
	} else {
		sb.WriteString(q.topology.RateInterval)
	}
	sb.WriteString("])")

	if !sumBy {
		sb.WriteString(" by(")
		sb.WriteString(strLabels)
		sb.WriteRune(')')
	}
	sb.WriteRune(')')

	if len(factor) > 0 {
		sb.WriteString(factor)
	}
	sb.WriteRune(')')

	q.appendQueryParams(sb)
	sb.WriteString("&step=")
	sb.WriteString(q.topology.Step)

	return sb.String()
}
