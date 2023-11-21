package loki

import (
	"fmt"
	"strings"

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
	skipEmptyDropState  bool
	skipEmptyDropCause  bool
	skipNonDNS          bool
	skipEmptyDNSLatency bool
	skipEmptyDNSRCode   bool
	skipEmptyRTT        bool
	scalar              string
	factor              string
}

type TopologyQueryBuilder struct {
	*FlowQueryBuilder
	topology *Topology
}

func NewTopologyQuery(cfg *Config, start, end, limit, rateInterval, step string, metricType constants.MetricType,
	metricFunction constants.MetricFunction, recordType constants.RecordType, packetLoss constants.PacketLoss,
	aggregate, groups string) (*TopologyQueryBuilder, error) {
	l := limit
	if len(l) == 0 {
		l = topologyDefaultLimit
	}

	labels := getLabels(aggregate, groups)
	field, factor := getFieldsAndFactor(metricType)
	f, scalar := getFunctionWithScalar(metricType, metricFunction)

	var dedup bool
	var rt constants.RecordType
	if utils.Contains(constants.AnyConnectionType, string(recordType)) {
		dedup = false
		rt = "endConnection"
	} else {
		dedup = true
		rt = "flowLog"
	}

	return &TopologyQueryBuilder{
		FlowQueryBuilder: NewFlowQueryBuilder(cfg, start, end, limit, dedup, rt, packetLoss),
		topology: &Topology{
			rateInterval:        rateInterval,
			step:                step,
			limit:               l,
			function:            f,
			dataField:           field,
			factor:              factor,
			labels:              labels,
			skipEmptyDropState:  aggregate == "droppedState",
			skipEmptyDropCause:  aggregate == "droppedCause",
			skipNonDNS:          metricType == constants.MetricTypeCountDNS,
			skipEmptyDNSLatency: metricType == constants.MetricTypeDNSLatencies,
			skipEmptyDNSRCode:   aggregate == "dnsRCode",
			skipEmptyRTT:        metricType == constants.MetricTypeFlowRTT,
			scalar:              scalar,
		},
	}, nil
}

func getLabels(aggregate, groups string) string {
	var fields []string
	switch aggregate {
	case "app":
		fields = []string{"app"}
	case "droppedState":
		fields = []string{"PktDropLatestState"}
	case "droppedCause":
		fields = []string{"PktDropLatestDropCause"}
	case "dnsRCode":
		fields = []string{"DnsFlagsResponseCode"}
	case "host":
		fields = []string{"SrcK8S_HostName", "DstK8S_HostName"}
	case "namespace":
		fields = []string{"SrcK8S_Namespace", "DstK8S_Namespace"}
	case "owner":
		fields = []string{"SrcK8S_OwnerName", "SrcK8S_OwnerType", "DstK8S_OwnerName", "DstK8S_OwnerType", "SrcK8S_Namespace", "DstK8S_Namespace"}
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

func getFieldsAndFactor(metricType constants.MetricType) (string, string) {
	switch metricType {
	case constants.MetricTypeDroppedPackets:
		return "PktDropPackets", ""
	case constants.MetricTypePackets:
		return "Packets", ""
	case constants.MetricTypeDroppedBytes:
		return "PktDropBytes", ""
	case constants.MetricTypeBytes:
		return "Bytes", ""
	case constants.MetricTypeDNSLatencies:
		return "DnsLatencyMs", ""
	case constants.MetricTypeFlowRTT:
		return "TimeFlowRttNs", "/1000000" // nanoseconds to miliseconds
	case constants.MetricTypeCount, constants.MetricTypeCountDNS:
		return "", ""
	default:
		panic(fmt.Sprint("wrong metricType for fields and factor provided", metricType))
	}
}

func getFunctionWithScalar(metricType constants.MetricType, metricFunction constants.MetricFunction) (string, string) {
	switch metricFunction {
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
	default:
		switch metricType {
		case constants.MetricTypeBytes,
			constants.MetricTypePackets,
			constants.MetricTypeDroppedBytes,
			constants.MetricTypeDroppedPackets:
			return "rate", ""
		case constants.MetricTypeCount, constants.MetricTypeCountDNS, constants.MetricTypeFlowRTT, constants.MetricTypeDNSLatencies:
			return "count_over_time", ""
		default:
			panic(fmt.Sprint("wrong metricType for function with scalar provided", metricType))
		}
	}
}

func (q *TopologyQueryBuilder) Build() string {
	sumBy := q.topology.function == "rate" || q.topology.function == "count_over_time"

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

	if q.topology.skipEmptyDropState {
		q.appendPktDropStateFilter(sb)
	} else if q.topology.skipEmptyDropCause {
		q.appendPktDropCauseFilter(sb)
	}

	if q.topology.skipEmptyDNSRCode {
		q.appendDNSRCodeFilter(sb)
	} else if q.topology.skipEmptyDNSLatency {
		q.appendDNSLatencyFilter(sb)
	} else if q.topology.skipNonDNS {
		q.appendDNSFilter(sb)
	}

	if q.topology.skipEmptyRTT {
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
