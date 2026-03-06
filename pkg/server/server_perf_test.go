package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/mock"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

// Helper function to setup mock servers for benchmarks
func setupBenchmarkServers(useBothDataSources bool) (*httptest.Server, *httptest.Server, *httptest.Server, *http.Client) {
	// Setup mock Loki service
	lokiMock := httpMock{}
	matrixResponse, _ := json.Marshal(model.QueryResponse{
		Status: "",
		Data: model.QueryResponseData{
			ResultType: model.ResultTypeMatrix,
			Result:     model.Matrix{},
		},
	})
	streamResponse, _ := json.Marshal(model.QueryResponse{
		Status: "",
		Data: model.QueryResponseData{
			ResultType: model.ResultTypeStream,
			Result:     model.Streams{},
		},
	})

	lokiMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		req := args.Get(1).(*http.Request)
		w := args.Get(0).(http.ResponseWriter)

		// Return matrix for metric queries, stream for flow records
		if req.URL.Path == "/loki/api/v1/query_range" {
			query := req.URL.Query().Get("query")
			if len(query) > 0 && query[0] != '{' {
				_, _ = w.Write(matrixResponse)
				return
			}
		}
		_, _ = w.Write(streamResponse)
	})
	lokiSvc := httptest.NewServer(&lokiMock)

	cfg := &config.Config{
		Loki: config.Loki{
			URL:    lokiSvc.URL,
			Labels: []string{"SrcK8S_Namespace", "DstK8S_Namespace"},
		},
		Frontend: config.Frontend{},
	}

	var promSvc *httptest.Server
	// Setup Prometheus mock if needed for Auto mode
	if useBothDataSources {
		promMock := httpMock{}
		promResponse := []byte(`{"status":"success","data":{"resultType":"matrix","result":[]}}`)
		promMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
			_, _ = args.Get(0).(http.ResponseWriter).Write(promResponse)
		})
		promSvc = httptest.NewServer(&promMock)
		cfg.Prometheus = config.Prometheus{URL: promSvc.URL}
	}

	// Setup auth mock
	authM := authMock{}
	authM.MockGranted()

	// Setup backend server
	backendRoutes := setupRoutes(context.TODO(), cfg, &authM)
	backendSvc := httptest.NewServer(backendRoutes)

	// Configure HTTP client with connection pooling to reduce port usage
	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
		},
	}

	return lokiSvc, promSvc, backendSvc, client
}

// BenchmarkTable measures Table View performance with and without histogram
func BenchmarkTable(b *testing.B) {
	lokiSvc, promSvc, backendSvc, client := setupBenchmarkServers(true)
	defer lokiSvc.Close()
	if promSvc != nil {
		defer promSvc.Close()
	}
	defer backendSvc.Close()

	b.Run("Basic", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			req, _ := http.NewRequest("GET", backendSvc.URL+"/api/loki/flow/records", nil)
			resp, err := client.Do(req)
			if err != nil {
				b.Fatalf("Request failed: %v", err)
			}
			resp.Body.Close()
			if resp.StatusCode != http.StatusOK {
				b.Fatalf("Expected 200, got %d", resp.StatusCode)
			}
		}
	})

	b.Run("WithHistogram", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			// Get flow records
			req1, _ := http.NewRequest("GET", backendSvc.URL+"/api/loki/flow/records", nil)
			resp1, err := client.Do(req1)
			if err != nil {
				b.Fatalf("Flow records request failed: %v", err)
			}
			resp1.Body.Close()
			if resp1.StatusCode != http.StatusOK {
				b.Fatalf("Expected 200, got %d", resp1.StatusCode)
			}

			// Get histogram data
			req2, _ := http.NewRequest("GET",
				backendSvc.URL+"/api/flow/metrics?dataSource=auto&function=count&aggregateBy=app&type=Flows", nil)
			resp2, err := client.Do(req2)
			if err != nil {
				b.Fatalf("Histogram metrics request failed: %v", err)
			}
			resp2.Body.Close()
			if resp2.StatusCode != http.StatusOK {
				b.Fatalf("Expected 200, got %d", resp2.StatusCode)
			}
		}
	})
}

// Helper to run a single topology query
func runTopologyQuery(b *testing.B, client *http.Client, url, query string) {
	req, _ := http.NewRequest("GET", url+query, nil)
	resp, err := client.Do(req)
	if err != nil {
		b.Fatalf("Request failed: %v", err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b.Fatalf("Expected 200, got %d", resp.StatusCode)
	}
}

// BenchmarkTopologyLoki measures Topology View with Loki data source for all metric types
func BenchmarkTopologyLoki(b *testing.B) {
	lokiSvc, promSvc, backendSvc, client := setupBenchmarkServers(false)
	defer lokiSvc.Close()
	if promSvc != nil {
		defer promSvc.Close()
	}
	defer backendSvc.Close()

	tests := []struct {
		name  string
		query string
	}{
		{"Bytes", "/api/flow/metrics?dataSource=loki&aggregateBy=resource&function=rate&type=Bytes"},
		{"Packets", "/api/flow/metrics?dataSource=loki&aggregateBy=resource&function=rate&type=Packets"},
		{"DNSLatency", "/api/flow/metrics?dataSource=loki&aggregateBy=resource&function=avg&type=DnsLatencyMs"},
		{"RTT", "/api/flow/metrics?dataSource=loki&aggregateBy=resource&function=avg&type=TimeFlowRttNs"},
		{"Dropped", "/api/flow/metrics?dataSource=loki&aggregateBy=resource&function=rate&type=PktDropPackets"},
	}

	for _, tt := range tests {
		b.Run(tt.name, func(b *testing.B) {
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				runTopologyQuery(b, client, backendSvc.URL, tt.query)
			}
		})
	}

	b.Run("BytesWithDrops", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runTopologyQuery(b, client, backendSvc.URL,
				"/api/flow/metrics?dataSource=loki&aggregateBy=resource&function=rate&type=Bytes")
			runTopologyQuery(b, client, backendSvc.URL,
				"/api/flow/metrics?dataSource=loki&aggregateBy=resource&function=rate&type=PktDropPackets")
		}
	})
}

// BenchmarkTopologyAuto measures Topology View with Auto data source for all metric types
func BenchmarkTopologyAuto(b *testing.B) {
	lokiSvc, promSvc, backendSvc, client := setupBenchmarkServers(true)
	defer lokiSvc.Close()
	if promSvc != nil {
		defer promSvc.Close()
	}
	defer backendSvc.Close()

	tests := []struct {
		name  string
		query string
	}{
		{"Bytes", "/api/flow/metrics?dataSource=auto&aggregateBy=resource&function=rate&type=Bytes"},
		{"Packets", "/api/flow/metrics?dataSource=auto&aggregateBy=resource&function=rate&type=Packets"},
		{"DNSLatency", "/api/flow/metrics?dataSource=auto&aggregateBy=resource&function=avg&type=DnsLatencyMs"},
		{"RTT", "/api/flow/metrics?dataSource=auto&aggregateBy=resource&function=avg&type=TimeFlowRttNs"},
		{"Dropped", "/api/flow/metrics?dataSource=auto&aggregateBy=resource&function=rate&type=PktDropPackets"},
	}

	for _, tt := range tests {
		b.Run(tt.name, func(b *testing.B) {
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				runTopologyQuery(b, client, backendSvc.URL, tt.query)
			}
		})
	}

	b.Run("BytesWithDrops", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runTopologyQuery(b, client, backendSvc.URL,
				"/api/flow/metrics?dataSource=auto&aggregateBy=resource&function=rate&type=Bytes")
			runTopologyQuery(b, client, backendSvc.URL,
				"/api/flow/metrics?dataSource=auto&aggregateBy=resource&function=rate&type=PktDropPackets")
		}
	})
}

// Overview page query builders
func getBasicQueries(dataSource string) []string {
	return []string{
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=rate&type=Bytes",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=rate&type=Bytes",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=rate&type=Packets",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=rate&type=Packets",
	}
}

func getDNSQueries(dataSource string) []string {
	return []string{
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=avg&type=DnsLatencyMs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=avg&type=DnsLatencyMs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=p90&type=DnsLatencyMs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=p90&type=DnsLatencyMs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=DnsName&function=count&type=DnsFlows",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=DnsFlagsResponseCode&function=count&type=DnsFlows",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=count&type=DnsFlows",
	}
}

func getRTTQueries(dataSource string) []string {
	return []string{
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=min&type=TimeFlowRttNs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=min&type=TimeFlowRttNs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=avg&type=TimeFlowRttNs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=avg&type=TimeFlowRttNs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=p90&type=TimeFlowRttNs",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=p90&type=TimeFlowRttNs",
	}
}

func getDroppedQueries(dataSource string) []string {
	return []string{
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=rate&type=PktDropPackets",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=rate&type=PktDropPackets",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=namespace&function=rate&type=PktDropBytes",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=app&function=rate&type=PktDropBytes",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=PktDropLatestState&function=rate&type=PktDropPackets",
		"/api/flow/metrics?dataSource=" + dataSource + "&aggregateBy=PktDropLatestDropCause&function=rate&type=PktDropPackets",
	}
}

// Helper to run overview queries
func runOverviewQueries(b *testing.B, client *http.Client, url string, queries []string) {
	for _, query := range queries {
		req, _ := http.NewRequest("GET", url+query, nil)
		resp, err := client.Do(req)
		if err != nil {
			b.Fatalf("Request failed: %v", err)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			b.Fatalf("Expected 200, got %d", resp.StatusCode)
		}
	}
}

// BenchmarkOverviewLoki measures Overview Page with Loki data source for all scenarios
func BenchmarkOverviewLoki(b *testing.B) {
	lokiSvc, promSvc, backendSvc, client := setupBenchmarkServers(false)
	defer lokiSvc.Close()
	if promSvc != nil {
		defer promSvc.Close()
	}
	defer backendSvc.Close()

	b.Run("Basic", func(b *testing.B) {
		queries := getBasicQueries("loki")
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})

	b.Run("DNS", func(b *testing.B) {
		queries := append(getBasicQueries("loki"), getDNSQueries("loki")...)
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})

	b.Run("RTT", func(b *testing.B) {
		queries := append(getBasicQueries("loki"), getRTTQueries("loki")...)
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})

	b.Run("Dropped", func(b *testing.B) {
		queries := append(getBasicQueries("loki"), getDroppedQueries("loki")...)
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})

	b.Run("Full", func(b *testing.B) {
		queries := getBasicQueries("loki")
		queries = append(queries, getDNSQueries("loki")...)
		queries = append(queries, getRTTQueries("loki")...)
		queries = append(queries, getDroppedQueries("loki")...)
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})
}

// BenchmarkOverviewAuto measures Overview Page with Auto data source for all scenarios
func BenchmarkOverviewAuto(b *testing.B) {
	lokiSvc, promSvc, backendSvc, client := setupBenchmarkServers(true)
	defer lokiSvc.Close()
	if promSvc != nil {
		defer promSvc.Close()
	}
	defer backendSvc.Close()

	b.Run("Basic", func(b *testing.B) {
		queries := getBasicQueries("auto")
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})

	b.Run("DNS", func(b *testing.B) {
		queries := append(getBasicQueries("auto"), getDNSQueries("auto")...)
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})

	b.Run("RTT", func(b *testing.B) {
		queries := append(getBasicQueries("auto"), getRTTQueries("auto")...)
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})

	b.Run("Dropped", func(b *testing.B) {
		queries := append(getBasicQueries("auto"), getDroppedQueries("auto")...)
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})

	b.Run("Full", func(b *testing.B) {
		queries := getBasicQueries("auto")
		queries = append(queries, getDNSQueries("auto")...)
		queries = append(queries, getRTTQueries("auto")...)
		queries = append(queries, getDroppedQueries("auto")...)
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			runOverviewQueries(b, client, backendSvc.URL, queries)
		}
	})
}
