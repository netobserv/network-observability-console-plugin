package server

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
)

func setupRoutes() *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/api/status", handler.Status)
	r.HandleFunc("/api/loki/flows", handler.GetFlows)
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/dist/")))
	return r
}
