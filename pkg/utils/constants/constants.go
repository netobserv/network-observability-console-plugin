package constants

type MetricType string
type RecordType string
type PacketLoss string
type Direction string

const (
	AppLabel                            = "app"
	AppLabelValue                       = "netobserv-flowcollector"
	RecordTypeLabel                     = "_RecordType"
	MetricTypeBytes          MetricType = "bytes"
	MetricTypePackets        MetricType = "packets"
	MetricTypeCount          MetricType = "count"
	MetricTypeCountDNS       MetricType = "countDns"
	MetricTypeFlowRTT        MetricType = "flowRtt"
	MetricTypeDNSLatencies   MetricType = "dnsLatencies"
	MetricTypeDroppedBytes   MetricType = "droppedBytes"
	MetricTypeDroppedPackets MetricType = "droppedPackets"
	DefaultMetricType        MetricType = MetricTypeBytes
	RecordTypeAllConnections RecordType = "allConnections"
	RecordTypeNewConnection  RecordType = "newConnection"
	RecordTypeHeartbeat      RecordType = "heartbeat"
	RecordTypeEndConnection  RecordType = "endConnection"
	RecordTypeLog            RecordType = "flowLog"
	DefaultRecordType        RecordType = RecordTypeLog
	PacketLossDropped        PacketLoss = "dropped"
	PacketLossHasDrop        PacketLoss = "hasDrops"
	PacketLossSent           PacketLoss = "sent"
	PacketLossAll            PacketLoss = "all"
	DefaultPacketLoss        PacketLoss = PacketLossAll
	Ingress                  Direction  = "0"
	Egress                   Direction  = "1"
	Inner                    Direction  = "2"
)

var AnyConnectionType = []string{
	string(RecordTypeAllConnections),
	string(RecordTypeNewConnection),
	string(RecordTypeHeartbeat),
	string(RecordTypeEndConnection),
}

var ConnectionTypes = []string{
	string(RecordTypeNewConnection),
	string(RecordTypeHeartbeat),
	string(RecordTypeEndConnection),
}
