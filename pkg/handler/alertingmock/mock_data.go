package alertingmock

// Mock data with fixed values for consistent testing

type mockMetric struct {
	namespace string
	node      string
	value     float64
}

// Fixed metric values for PacketDropsByKernel (percentage)
var packetDropsByKernelData = []mockMetric{
	{namespace: "uss-enterprise", value: 15.5},
	{namespace: "uss-raven", value: 8.2},
	{namespace: "sh-raan", value: 22.7},
	{namespace: "galileo", value: 3.1},
	{node: "vulcan", value: 6.8},
	{node: "denobula", value: 11.2},
}

// Fixed metric values for PacketDropsByDevice (percentage)
var packetDropsByDeviceData = []mockMetric{
	{node: "vulcan", value: 4.2},
	{node: "denobula", value: 7.1},
	{node: "caldonia", value: 2.3},
}

// Fixed metric values for DNSErrors (percentage)
var dnsErrorsData = []mockMetric{
	{value: 6.5}, // Global
	{namespace: "uss-enterprise", value: 12.3},
	{namespace: "la-sirena", value: 7.8},
	{namespace: "phoenix", value: 4.2},
}

// Fixed metric values for DNSNxDomain (percentage)
var dnsNxDomainData = []mockMetric{
	{namespace: "uss-raven", value: 25.4},
	{namespace: "the-whale-probe", value: 15.7},
	{namespace: "scimitar", value: 85.2},
}

// Fixed metric values for NetpolDenied (percentage)
var netpolDeniedData = []mockMetric{
	{namespace: "uss-defiant", value: 8.9},
	{namespace: "romulan-warbird", value: 12.4},
	{namespace: "sh-raan", value: 6.1},
}

// Fixed metric values for LatencyHighTrend (percentage increase)
var latencyHighTrendData = []mockMetric{
	{namespace: "uss-excelsior", value: 125.3},
	{namespace: "galileo", value: 85.7},
	{namespace: "uss-enterprise", value: 110.2},
}

// Fixed metric values for ExternalEgressHighTrend (percentage increase)
var externalEgressHighTrendData = []mockMetric{
	{node: "vulcan", value: 245.8},
	{node: "denobula", value: 178.3},
	{namespace: "uss-enterprise", value: 156.7},
	{namespace: "phoenix", value: 520.1},
	{namespace: "la-sirena", value: 89.3},
}

// Fixed metric values for ExternalIngressHighTrend (percentage increase)
var externalIngressHighTrendData = []mockMetric{
	{node: "vulcan", value: 215.2},
	{node: "caldonia", value: 192.6},
	{namespace: "uss-raven", value: 378.9},
	{namespace: "scimitar", value: 124.5},
	{namespace: "uss-defiant", value: 67.3},
}

func getMockData(template string) []mockMetric {
	switch template {
	case "PacketDropsByKernel":
		return packetDropsByKernelData
	case "PacketDropsByDevice":
		return packetDropsByDeviceData
	case "DNSErrors":
		return dnsErrorsData
	case "DNSNxDomain":
		return dnsNxDomainData
	case "NetpolDenied":
		return netpolDeniedData
	case "LatencyHighTrend":
		return latencyHighTrendData
	case "ExternalEgressHighTrend":
		return externalEgressHighTrendData
	case "ExternalIngressHighTrend":
		return externalIngressHighTrendData
	default:
		return []mockMetric{}
	}
}
