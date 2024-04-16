package loki

import (
	"fmt"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

const (
	topologyDefaultLimit = "100"
)

type Topology struct {
	limit               string
	rateInterval        string
	step                string
	function            string
	dataField           string
	labels              string
	filter              string
	skipNonDNS          bool
	skipEmptyDNSLatency bool
	skipEmptyRTT        bool
	scalar              string
	factor              string
}

type TopologyQueryBuilder struct {
	*FlowQueryBuilder
	topology *Topology
}

func NewTopologyQuery(cfg *config.Loki, start, end, limit, rateInterval, step, metricType string,
	metricFunction constants.MetricFunction, recordType constants.RecordType, packetLoss constants.PacketLoss,
	aggregate, groups string, dedupMark bool) (*TopologyQueryBuilder, error) {
	l := limit
	if len(l) == 0 {
		l = topologyDefaultLimit
	}

	labels, filter := getLabelsAndFilter(aggregate, groups)
	if cfg.IsLabel(filter) {
		filter = ""
	}
	field := getField(metricType)
	factor := getFactor(metricType)
	function, scalar := getFunctionWithScalar(metricFunction)

	var dedup bool
	var rt constants.RecordType
	if utils.Contains(constants.AnyConnectionType, string(recordType)) {
		dedup = false
		rt = "endConnection"
	} else {
		dedup = dedupMark
		rt = "flowLog"
	}

	return &TopologyQueryBuilder{
		FlowQueryBuilder: NewFlowQueryBuilder(cfg, start, end, limit, dedup, rt, packetLoss),
		topology: &Topology{
			rateInterval:        rateInterval,
			step:                step,
			limit:               l,
			function:            function,
			dataField:           field,
			factor:              factor,
			labels:              labels,
			filter:              filter,
			skipNonDNS:          metricType == constants.MetricTypeDNSFlows,
			skipEmptyDNSLatency: metricType == constants.MetricTypeDNSLatency,
			skipEmptyRTT:        metricType == constants.MetricTypeFlowRTT,
			scalar:              scalar,
		},
	}, nil
}

func manageGroupLabels(fields []string, groups string) []string {
	if len(groups) > 0 {
		if strings.Contains(groups, "clusters") {
			if !utils.Contains(fields, "K8S_ClusterName") {
				fields = append(fields, "K8S_ClusterName")
			}
		}

		if strings.Contains(groups, "zones") {
			if !utils.Contains(fields, "SrcK8S_Zone") {
				fields = append(fields, "SrcK8S_Zone", "DstK8S_Zone")
			}
		}

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
	return fields
}

func getLabelsAndFilter(aggregate, groups string) (string, string) {
	var fields []string
	var filter string
	switch aggregate {
	case "app":
		fields = []string{"app"}
	case "droppedState":
		fields = []string{"PktDropLatestState"}
	case "droppedCause":
		fields = []string{"PktDropLatestDropCause"}
	case "dnsRCode":
		fields = []string{"DnsFlagsResponseCode"}
	case "cluster":
		fields = []string{"K8S_ClusterName"}
	case "zone":
		fields = []string{"SrcK8S_Zone", "DstK8S_Zone"}
	case "host":
		fields = []string{"SrcK8S_HostName", "DstK8S_HostName"}
	case "namespace":
		fields = []string{"SrcK8S_Namespace", "DstK8S_Namespace"}
	case "owner":
		fields = []string{"SrcK8S_OwnerName", "SrcK8S_OwnerType", "DstK8S_OwnerName", "DstK8S_OwnerType", "SrcK8S_Namespace", "DstK8S_Namespace"}
	case "resource":
		fields = []string{"SrcK8S_Name", "SrcK8S_Type", "SrcK8S_OwnerName", "SrcK8S_OwnerType", "SrcK8S_Namespace", "SrcAddr", "SrcK8S_HostName", "DstK8S_Name", "DstK8S_Type", "DstK8S_OwnerName", "DstK8S_OwnerType", "DstK8S_Namespace", "DstAddr", "DstK8S_HostName"}
	default:
		fields = []string{aggregate}
		filter = aggregate
	}
	fields = manageGroupLabels(fields, groups)
	return strings.Join(fields[:], ","), filter
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
		return "/1000000" // nanoseconds to miliseconds
	default:
		return ""
	}
}

func getFunctionWithScalar(metricFunction constants.MetricFunction) (string, string) {
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
	sumBy := q.topology.function == "rate" || q.topology.function == "count_over_time" || q.topology.function == "sum_over_time"

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
	if q.topology.function == "min_over_time" {
		sb.WriteString("bottomk")
	} else {
		sb.WriteString("topk")
	}
	sb.WriteRune('(')
	sb.WriteString(q.topology.limit)
	sb.WriteRune(',')

	if sumBy {
		sb.WriteString("sum by(")
		sb.WriteString(q.topology.labels)
		sb.WriteRune(')')
	}

	sb.WriteRune('(')
	sb.WriteString(q.topology.function)
	sb.WriteString("(")
	if len(q.topology.scalar) > 0 {
		sb.WriteString(q.topology.scalar)
		sb.WriteRune(',')
	}
	q.appendLabels(sb)
	q.appendLineFilters(sb)

	if len(q.topology.filter) > 0 {
		q.appendFilter(sb, q.topology.filter)
	}

	if q.topology.skipEmptyDNSLatency {
		q.appendDNSLatencyFilter(sb)
	} else if q.topology.skipNonDNS {
		q.appendDNSFilter(sb)
	} else if q.topology.skipEmptyRTT {
		q.appendRTTFilter(sb)
	}

	q.appendJSON(sb, true)
	if len(q.topology.dataField) > 0 {
		sb.WriteString("|unwrap ")
		sb.WriteString(q.topology.dataField)
		sb.WriteString(`|__error__=""`)
	}
	sb.WriteRune('[')
	if q.topology.function != "rate" {
		sb.WriteString(q.topology.step)
	} else {
		sb.WriteString(q.topology.rateInterval)
	}
	sb.WriteString("])")

	if !sumBy {
		sb.WriteString(" by(")
		sb.WriteString(q.topology.labels)
		sb.WriteRune(')')
	}
	sb.WriteRune(')')

	if len(q.topology.factor) > 0 {
		sb.WriteString(q.topology.factor)
	}
	sb.WriteRune(')')

	q.appendQueryParams(sb)
	sb.WriteString("&step=")
	sb.WriteString(q.topology.step)

	return sb.String()
}
