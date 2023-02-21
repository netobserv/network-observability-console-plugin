package constants

type Reporter string
type RecordType string

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
)

var ConnectionTypes = []string{
	string(RecordTypeNewConnection),
	string(RecordTypeHeartbeat),
	string(RecordTypeEndConnection),
}
