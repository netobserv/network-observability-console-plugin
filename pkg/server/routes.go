package server

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
)

func setupRoutes(cfg *Config) *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/api/status", handler.Status)
	r.HandleFunc("/api/loki/flows", handler.GetFlows(cfg.Loki, false))
	r.HandleFunc("/api/loki/export", handler.GetFlows(cfg.Loki, true))
	r.HandleFunc("/api/loki/topology", handler.GetTopology(cfg.Loki))
	r.HandleFunc("/api/resources/namespaces", handler.GetNamespaces(cfg.Loki))
	r.HandleFunc("/api/resources/namespace/{namespace}/kind/{kind}/names", handler.GetNames(cfg.Loki))
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/dist/")))
	return r
}
