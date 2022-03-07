package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func GetResources(kubeClient kubernetes.Interface, resourceType string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()

		rt := resourceType
		if len(rt) == 0 {
			rt = params.Get("resourceType")
		}

		// TODO: remove all logs
		hlog.Infof("GetResources resourceType : %s query params : %s\n", rt, params)

		result := []string{}
		switch rt {
		case "namespaces":
			// list all namespaces
			namespaceList, err := kubeClient.CoreV1().Namespaces().List(r.Context(), metav1.ListOptions{})
			if err != nil {
				panic(err)
			}

			fmt.Printf("found %d namespaces\n", len(namespaceList.Items))
			for i := range namespaceList.Items {
				result = append(result, namespaceList.Items[i].Name)
			}
		case "pods":
			namespace := params.Get("namespace")

			if len(namespace) == 0 {
				writeError(w, http.StatusServiceUnavailable, "namespace cannot be empty")
				return
			}

			// list all Pods in namespace
			podList, err := kubeClient.CoreV1().Pods(namespace).List(r.Context(), metav1.ListOptions{})
			if err != nil {
				panic(err)
			}

			fmt.Printf("found %d pods in namespace %s\n", len(podList.Items), namespace)
			for i := range podList.Items {
				result = append(result, podList.Items[i].Name)
			}
		default:
			writeError(w, http.StatusServiceUnavailable,
				fmt.Sprintf("unknown resourceType: %s", rt))
			return
		}

		resp, err := json.Marshal(result)
		if err != nil {
			writeError(w, http.StatusServiceUnavailable,
				fmt.Sprintf("cannot marshal %v", params))
		} else {
			writeRawJSON(w, http.StatusOK, resp)
		}
	}
}
