package loki

import (
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

const (
	topologyDefaultLimit = "100"
)

type Topology struct {
	limit        string
	rateInterval string
	step         string
	dataField    string
	fields       string
}

type TopologyQueryBuilder struct {
	*FlowQueryBuilder
	topology *Topology
}

func NewTopologyQuery(cfg *Config, start, end, limit, rateInterval, step, metricType, reporter, layer, scope, groups string) (*TopologyQueryBuilder, error) {
	l := limit
	if len(l) == 0 {
		l = topologyDefaultLimit
	}

	var t string
	switch metricType {
	case "packets":
		t = "Packets"
	default:
		t = "Bytes"
	}

	return &TopologyQueryBuilder{
		FlowQueryBuilder: NewFlowQueryBuilder(cfg, start, end, limit, reporter, layer),
		topology: &Topology{
			rateInterval: rateInterval,
			step:         step,
			limit:        l,
			dataField:    t,
			fields:       getFields(scope, groups),
		},
	}, nil
}

func getFields(scope, groups string) string {
	var fields []string
	switch scope {
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

func (q *TopologyQueryBuilder) Build() string {
	// Build topology query like:
	// /<url path>?query=
	//		topk(
	// 			<k>,
	//			sum by(<aggregations>) (
	//				rate(
	//					{<label filters>}|<line filters>|json|<json filters>
	//						|unwrap Bytes|__error__=""[300s]
	//				)
	//			)
	//		)
	//		&<query params>&step=300s
	sb := q.createStringBuilderURL()
	sb.WriteString("topk(")
	sb.WriteString(q.topology.limit)
	sb.WriteString(",sum by(")
	sb.WriteString(q.topology.fields)
	sb.WriteString(") (rate(")
	q.appendLabels(sb)
	q.appendLineFilters(sb)
	q.appendJSON(sb, true)
	if len(q.topology.dataField) > 0 {
		sb.WriteString("|unwrap ")
		sb.WriteString(q.topology.dataField)
		sb.WriteString(`|__error__=""`)
	}
	sb.WriteRune('[')
	sb.WriteString(q.topology.rateInterval)
	sb.WriteString("])))")
	q.appendQueryParams(sb)
	sb.WriteString("&step=")
	sb.WriteString(q.topology.step)

	return sb.String()
}
