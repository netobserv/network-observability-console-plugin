package constants

type Reporter string
type RecordType string
type PacketLoss string

const (
	AppLabel                            = "app"
	AppLabelValue                       = "netobserv-flowcollector"
	ReporterSource           Reporter   = "source"
	ReporterDestination      Reporter   = "destination"
	ReporterBoth             Reporter   = "both"
	RecordTypeLabel                     = "_RecordType"
	RecordTypeAllConnections RecordType = "allConnections"
	RecordTypeNewConnection  RecordType = "newConnection"
	RecordTypeHeartbeat      RecordType = "heartbeat"
	RecordTypeEndConnection  RecordType = "endConnection"
	RecordTypeLog            RecordType = "flowLog"
	PacketLossDropped        PacketLoss = "dropped"
	PacketLossHasDrop        PacketLoss = "hasDrops"
	PacketLossSent           PacketLoss = "sent"
	PacketLossAll            PacketLoss = "all"
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
