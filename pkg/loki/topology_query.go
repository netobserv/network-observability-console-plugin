package loki

import (
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
	fields              string
	skipEmptyDropState  bool
	skipEmptyDropCause  bool
	skipNonDNS          bool
	skipEmptyDNSLatency bool
	skipEmptyDNSRCode   bool
	skipEmptyRTT        bool
	factor              string
}

type TopologyQueryBuilder struct {
	*FlowQueryBuilder
	topology *Topology
}

func NewTopologyQuery(cfg *Config, start, end, limit, rateInterval, step string, metricType constants.MetricType,
	recordType constants.RecordType, packetLoss constants.PacketLoss,
	aggregate, groups string) (*TopologyQueryBuilder, error) {
	l := limit
	if len(l) == 0 {
		l = topologyDefaultLimit
	}

	fields := getFields(aggregate, groups)
	var f, t string
	factor := ""
	switch metricType {
	case constants.MetricTypeCount, constants.MetricTypeCountDNS:
		f = "count_over_time"
	case constants.MetricTypeDroppedPackets:
		f = "rate"
		t = "PktDropPackets"
	case constants.MetricTypePackets:
		f = "rate"
		t = "Packets"
	case constants.MetricTypeDroppedBytes:
		f = "rate"
		t = "PktDropBytes"
	case constants.MetricTypeDNSLatencies:
		f = "avg_over_time"
		t = "DnsLatencyMs"
	case constants.MetricTypeBytes:
		f = "rate"
		t = "Bytes"
	case constants.MetricTypeFlowRTT:
		f = "avg_over_time"
		t = "TimeFlowRttNs"
		factor = "/1000000" // nanoseconds to miliseconds
	}

	var d bool
	var rt constants.RecordType
	if utils.Contains(constants.AnyConnectionType, string(recordType)) {
		d = false
		rt = "endConnection"
	} else {
		d = true
		rt = "flowLog"
	}

	return &TopologyQueryBuilder{
		FlowQueryBuilder: NewFlowQueryBuilder(cfg, start, end, limit, d, rt, packetLoss),
		topology: &Topology{
			rateInterval:        rateInterval,
			step:                step,
			limit:               l,
			function:            f,
			dataField:           t,
			fields:              fields,
			skipEmptyDropState:  aggregate == "droppedState",
			skipEmptyDropCause:  aggregate == "droppedCause",
			skipNonDNS:          metricType == constants.MetricTypeCountDNS,
			skipEmptyDNSLatency: metricType == constants.MetricTypeDNSLatencies,
			skipEmptyDNSRCode:   aggregate == "dnsRCode",
			skipEmptyRTT:        metricType == constants.MetricTypeFlowRTT,
			factor:              factor,
		},
	}, nil
}

func getFields(aggregate, groups string) string {
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

func (q *TopologyQueryBuilder) Build() string {
	// Build topology query like:
	// /<url path>?query=
	//		topk(
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
	sb.WriteString("topk(")
	sb.WriteString(q.topology.limit)
	sb.WriteRune(',')
	if q.topology.function == "avg_over_time" {
		sb.WriteString("avg")
	} else {
		sb.WriteString("sum")
	}
	sb.WriteString(" by(")
	sb.WriteString(q.topology.fields)
	sb.WriteString(") (")
	sb.WriteString(q.topology.function)
	sb.WriteString("(")
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
	if len(q.topology.factor) > 0 {
		sb.WriteString(q.topology.factor)
	}
	sb.WriteString("))")
	q.appendQueryParams(sb)
	sb.WriteString("&step=")
	sb.WriteString(q.topology.step)

	return sb.String()
}
