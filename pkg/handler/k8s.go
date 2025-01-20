package handler

import (
	"context"
	"fmt"
	"net/http"

	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/resources"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"

	"k8s.io/apimachinery/pkg/runtime/schema"
)

func (h *Handlers) GetUDNIdss(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		token, err := auth.GetUserToken(r.Header)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
		}

		cudns, err := resources.List(ctx, token, schema.GroupVersionResource{
			Group:    "k8s.ovn.org",
			Version:  "v1",
			Resource: "clusteruserdefinednetworks",
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
		}

		udns, err := resources.List(ctx, token, schema.GroupVersionResource{
			Group:    "k8s.ovn.org",
			Version:  "v1",
			Resource: "userdefinednetworks",
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
		}

		values := []string{}
		for _, cudn := range cudns {
			md := cudn.Object["metadata"].(map[string]interface{})
			values = append(values, fmt.Sprintf("%s", md["name"]))
		}
		for _, udn := range udns {
			md := udn.Object["metadata"].(map[string]interface{})
			values = append(values, fmt.Sprintf("%s.%s", md["namespace"], md["name"]))
		}
		writeJSON(w, http.StatusOK, utils.NonEmpty(utils.Dedup(values)))
	}
}
