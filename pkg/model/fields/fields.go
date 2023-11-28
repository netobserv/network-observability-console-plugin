package fields

const (
	Src            = "Src"
	Dst            = "Dst"
	Namespace      = "K8S_Namespace"
	SrcNamespace   = Src + Namespace
	DstNamespace   = Dst + Namespace
	OwnerType      = "K8S_OwnerType"
	SrcOwnerType   = Src + OwnerType
	DstOwnerType   = Dst + OwnerType
	OwnerName      = "K8S_OwnerName"
	SrcOwnerName   = Src + OwnerName
	DstOwnerName   = Dst + OwnerName
	Type           = "K8S_Type"
	SrcType        = Src + Type
	DstType        = Dst + Type
	Name           = "K8S_Name"
	SrcName        = Src + Name
	DstName        = Dst + Name
	Addr           = "Addr"
	SrcAddr        = Src + Addr
	DstAddr        = Dst + Addr
	Port           = "Port"
	SrcPort        = Src + Port
	DstPort        = Dst + Port
	HostIP         = "K8S_HostIP"
	SrcHostIP      = Src + HostIP
	DstHostIP      = Dst + HostIP
	HostName       = "K8S_HostName"
	SrcHostName    = Src + HostName
	DstHostName    = Dst + HostName
	Packets        = "Packets"
	PktDropPackets = "PktDropPackets"
	Proto          = "Proto"
	Bytes          = "Bytes"
	DSCP           = "Dscp"
	PktDropBytes   = "PktDropBytes"
	FlowDirection  = "FlowDirection"
	DNSID          = "DnsId"
	DNSLatency     = "DnsLatencyMs"
	DNSErrNo       = "DnsErrno"
	Duplicate      = "Duplicate"
	TimeFlowRTT    = "TimeFlowRttNs"
)

func IsNumeric(v string) bool {
	switch v {
	case
		DNSID,
		DNSLatency,
		DNSErrNo,
		TimeFlowRTT,
		Port,
		SrcPort,
		DstPort,
		Packets,
		Proto,
		Bytes,
		DSCP:
		return true
	default:
		return false
	}
}

func IsIP(f string) bool {
	switch f {
	case
		DstAddr,
		SrcAddr,
		DstHostIP,
		SrcHostIP:
		return true
	default:
		return false
	}
}
