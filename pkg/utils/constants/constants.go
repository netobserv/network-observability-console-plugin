package constants

type Reporter string
type Layer string

const (
	AppLabel                     = "app"
	AppLabelValue                = "netobserv-flowcollector"
	ReporterSource      Reporter = "source"
	ReporterDestination Reporter = "destination"
	ReporterBoth        Reporter = "both"
	LayerInfrastructure Layer    = "infrastructure"
	LayerApplication    Layer    = "application"
	LayerBoth           Layer    = "both"
)
