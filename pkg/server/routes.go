package server

import (
	"net/http"

	"github.com/gorilla/mux"
	"k8s.io/client-go/kubernetes"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
)

func setupRoutes(cfg *Config, kubeClient kubernetes.Interface) *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/api/status", handler.Status)
	r.HandleFunc("/api/loki/flows", handler.GetFlows(cfg.Loki, false))
	r.HandleFunc("/api/loki/export", handler.GetFlows(cfg.Loki, true))
	r.HandleFunc("/api/resources", handler.GetResources(kubeClient, ""))
	r.HandleFunc("/api/resources/namespaces", handler.GetResources(kubeClient, "namespaces"))
	r.HandleFunc("/api/resources/pods", handler.GetResources(kubeClient, "pods"))
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/dist/")))
	return r
}
