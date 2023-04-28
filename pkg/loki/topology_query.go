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
	limit        string
	rateInterval string
	step         string
	function     string
	dataField    string
	fields       string
	dedup        bool
}

type TopologyQueryBuilder struct {
	*FlowQueryBuilder
	topology *Topology
}

func NewTopologyQuery(cfg *Config, start, end, limit, rateInterval, step, metricType string,
	recordType constants.RecordType, reporter constants.Reporter, packetLoss constants.PacketLoss,
	scope, groups string) (*TopologyQueryBuilder, error) {
	l := limit
	if len(l) == 0 {
		l = topologyDefaultLimit
	}

	var f, t string
	switch metricType {
	case "count":
		f = "count_over_time"
	case "packets":
		f = "rate"
		t = "Packets"
	default:
		f = "rate"
		t = "Bytes"
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
		FlowQueryBuilder: NewFlowQueryBuilder(cfg, start, end, limit, reporter, rt, packetLoss),
		topology: &Topology{
			rateInterval: rateInterval,
			step:         step,
			limit:        l,
			function:     f,
			dataField:    t,
			fields:       getFields(scope, groups),
			dedup:        d,
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
	//			sum by(<aggregations>) (
	//				<function>(
	//					{<label filters>}|<line filters>|json|<json filters>
	//						|unwrap Bytes|__error__=""[<interval>]
	//				)
	//			)
	//		)
	//		&<query params>&step=<step>
	sb := q.createStringBuilderURL()
	sb.WriteString("topk(")
	sb.WriteString(q.topology.limit)
	sb.WriteString(",sum by(")
	sb.WriteString(q.topology.fields)
	sb.WriteString(") (")
	sb.WriteString(q.topology.function)
	sb.WriteString("(")
	q.appendLabels(sb)
	q.appendLineFilters(sb)
	if q.topology.dedup {
		q.appendDeduplicateFilter(sb)
	}
	q.appendJSON(sb, true)
	if len(q.topology.dataField) > 0 {
		sb.WriteString("|unwrap ")
		sb.WriteString(q.topology.dataField)
		sb.WriteString(`|__error__=""`)
	}
	sb.WriteRune('[')
	if q.topology.function == "count_over_time" {
		sb.WriteString(q.topology.step)
	} else {
		sb.WriteString(q.topology.rateInterval)
	}
	sb.WriteString("])))")
	q.appendQueryParams(sb)
	sb.WriteString("&step=")
	sb.WriteString(q.topology.step)

	return sb.String()
}
