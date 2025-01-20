package resources

import (
	"context"

	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

func List(ctx context.Context, token string, gvr schema.GroupVersionResource) ([]unstructured.Unstructured, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}
	config.BearerToken = token
	config.BearerTokenFile = ""

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	// Retrieve the custom resource
	list, err := dynamicClient.Resource(gvr).List(ctx, v1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return list.Items, err
}
