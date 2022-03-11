package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func GetResources(kubeClient kubernetes.Interface, kind string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()

		k := kind
		if len(k) == 0 {
			k = strings.ToLower(params.Get("kind"))
		}

		// TODO: remove all logs
		hlog.Infof("GetResources kind : %s query params : %s\n", k, params)

		var result *[]string
		var err error

		if k == "namespace" {
			result, err = getNamespaces(r.Context(), kubeClient)
		} else {
			namespace := params.Get("namespace")
			if len(namespace) == 0 {
				writeError(w, http.StatusServiceUnavailable, "namespace cannot be empty")
				return
			}
			result, err = getK8SObjects(r.Context(), kubeClient, namespace, k)
		}

		if err != nil {
			writeError(w, http.StatusServiceUnavailable,
				fmt.Sprintf("can't get list of %s: %v", k, err))
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

func getNamespaces(context context.Context, kubeClient kubernetes.Interface) (*[]string, error) {
	result := []string{}
	namespaceList, err := kubeClient.CoreV1().Namespaces().List(context, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	fmt.Printf("found %d namespaces\n", len(namespaceList.Items))
	for i := range namespaceList.Items {
		result = append(result, namespaceList.Items[i].Name)
	}
	return &result, nil
}

//nolint:cyclop //ignore cyclomatic complexity for these cases
func getK8SObjects(context context.Context, kubeClient kubernetes.Interface, namespace string, kind string) (*[]string, error) {
	result := []string{}
	switch kind {
	case "cronjob":
		cronJobList, err := kubeClient.BatchV1().CronJobs(namespace).List(context, metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for i := range cronJobList.Items {
			result = append(result, cronJobList.Items[i].Name)
		}
	case "job":
		jobList, err := kubeClient.BatchV1().Jobs(namespace).List(context, metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for i := range jobList.Items {
			result = append(result, jobList.Items[i].Name)
		}
	case "daemonset":
		daemonSetList, err := kubeClient.AppsV1().DaemonSets(namespace).List(context, metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for i := range daemonSetList.Items {
			result = append(result, daemonSetList.Items[i].Name)
		}
	case "statefulset":
		statefulSetList, err := kubeClient.AppsV1().StatefulSets(namespace).List(context, metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for i := range statefulSetList.Items {
			result = append(result, statefulSetList.Items[i].Name)
		}
	case "service":
		serviceList, err := kubeClient.CoreV1().Services(namespace).List(context, metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for i := range serviceList.Items {
			result = append(result, serviceList.Items[i].Name)
		}
	case "pod":
		podList, err := kubeClient.CoreV1().Pods(namespace).List(context, metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for i := range podList.Items {
			result = append(result, podList.Items[i].Name)
		}
	case "deployment":
		deploymentList, err := kubeClient.AppsV1().Deployments(namespace).List(context, metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for i := range deploymentList.Items {
			result = append(result, deploymentList.Items[i].Name)
		}
	default:
		return nil, fmt.Errorf("unknown kind: %s", kind)
	}

	fmt.Printf("found %d objects of kind %s in namespace %s\n", len(result), kind, namespace)
	return &result, nil
}
