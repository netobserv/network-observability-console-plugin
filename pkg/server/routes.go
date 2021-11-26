package server

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
)

func setupRoutes() *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/api/dummy", handler.Dummy)
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/dist/")))
	return r
}
