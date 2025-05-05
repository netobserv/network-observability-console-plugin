package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/prometheus"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

type MCPServer struct {
	context context.Context
	server  *server.MCPServer
	handler handler.Handlers
}

func StartMCPServer(ctx context.Context, cfg *config.Config) error {
	var promInventory *prometheus.Inventory
	if cfg.IsPromEnabled() {
		promInventory = prometheus.NewInventory(&cfg.Prometheus)
	}

	s := &MCPServer{
		context: ctx,
		server: server.NewMCPServer(
			"mcp-netobserv",
			cfg.Frontend.BuildVersion,
			server.WithResourceCapabilities(true, true),
			server.WithPromptCapabilities(true),
			server.WithToolCapabilities(true),
			server.WithLogging(),
		),
		handler: handler.Handlers{Cfg: cfg, PromInventory: promInventory},
	}

	s.server.SetTools(
		server.ServerTool{
			Tool: mcp.NewTool("flows",
				getToolOptions("Get netobserv flow logs in the current cluster")...,
			),
			Handler: s.GetFlows,
		},
		server.ServerTool{
			Tool: mcp.NewTool("metrics",
				getToolOptions("Get netobserv flow metrics in the current cluster")...,
			),
			Handler: s.GetMetrics,
		},
	)

	switch cfg.Server.MCP.Transport {
	case "stdio":
		return server.ServeStdio(s.server)
	case "sse":
		options := make([]server.SSEOption, 0)
		if cfg.Server.MCP.SSEAddress != "" {
			options = append(options, server.WithBaseURL(cfg.Server.MCP.SSEAddress))
		}
		return server.NewSSEServer(s.server, options...).Start(fmt.Sprintf(":%d", cfg.Server.MCP.SSEPort))
	default:
		return fmt.Errorf("unknown MCP transport: %s", cfg.Server.MCP.Transport)
	}
}

func getToolOptions(description string) []mcp.ToolOption {
	return []mcp.ToolOption{
		mcp.WithDescription(description),
		//mcp.WithString("timeRange", mcp.Description("Time range to capture")),
		//mcp.WithString("startTime", mcp.Description("Start time to capture")),
		//mcp.WithString("endTime", mcp.Description("End time to capture")),
		mcp.WithString("namespace", mcp.Description("Source or Destnation namespace of the flow")),
		mcp.WithString("limit", mcp.Description("Limit results")),
		//mcp.WithString("filters", mcp.Description("Filters to apply (url-encoded)")),
	}
}

func parseRequest(ctr mcp.CallToolRequest) (http.Header, url.Values) {
	header := http.Header{}
	params := url.Values{}

	for key, value := range ctr.Params.Arguments {
		params.Add(key, fmt.Sprintf("%v", value))
	}
	return header, params
}

func parseResults(response *model.AggregatedQueryResponse, code int, err error) (*mcp.CallToolResult, error) {
	if code != http.StatusOK || err != nil {
		return &mcp.CallToolResult{
			IsError: true,
			Content: []mcp.Content{
				mcp.TextContent{
					Type: "text",
					Text: fmt.Sprintf("query returned status %d error %v", code, err),
				},
			},
		}, nil
	}

	content, err := json.Marshal(response)
	if code != http.StatusOK || err != nil {
		return &mcp.CallToolResult{
			IsError: true,
			Content: []mcp.Content{
				mcp.TextContent{
					Type: "text",
					Text: fmt.Sprintf("json.Marshal returned error %v", err),
				},
			},
		}, nil
	}
	result := &mcp.CallToolResult{
		Content: []mcp.Content{
			mcp.TextContent{
				Type: "text",
				Text: string(content),
			},
		},
	}

	return result, nil
}

func (s *MCPServer) GetFlows(ctx context.Context, ctr mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	header, params := parseRequest(ctr)
	clients := handler.NewLokiClient(&s.handler.Cfg.Loki, header, false)
	flows, code, err := s.handler.QueryFlows(ctx, clients, params)
	return parseResults(flows, code, err)
}

func (s *MCPServer) GetMetrics(ctx context.Context, ctr mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	header, params := parseRequest(ctr)
	namespace := params.Get("namespace")
	clients, err := handler.NewClients(s.handler.Cfg, header, false, namespace)
	if err != nil {
		return &mcp.CallToolResult{
			IsError: true,
			Content: []mcp.Content{
				mcp.TextContent{
					Type: "text",
					Text: err.Error(),
				},
			},
		}, nil
	}

	metrics, code, err := s.handler.QueryMetrics(ctx, clients, params, constants.DataSourceLoki)
	return parseResults(metrics, code, err)
}
