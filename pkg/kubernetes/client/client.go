package client

import (
	"context"

	authv1 "k8s.io/api/authentication/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// Interface for mocking
type KubeAPI interface {
	CreateTokenReview(ctx context.Context, tr *authv1.TokenReview, opts *metav1.CreateOptions) (*authv1.TokenReview, error)
}

type APIProvider func() (KubeAPI, error)

type InCluster struct {
	KubeAPI
	client *kubernetes.Clientset
}

func (c *InCluster) CreateTokenReview(ctx context.Context, tr *authv1.TokenReview, opts *metav1.CreateOptions) (*authv1.TokenReview, error) {
	return c.client.AuthenticationV1().TokenReviews().Create(ctx, tr, *opts)
}

func NewInCluster() (KubeAPI, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}
	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	return &InCluster{client: client}, nil
}
