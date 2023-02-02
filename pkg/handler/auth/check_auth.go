package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/sirupsen/logrus"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

var hlog = logrus.WithField("module", "handler.auth")

const AuthHeader = "Authorization"

type Checker interface {
	CheckAuth(ctx context.Context, header http.Header) error
}

type BearerTokenChecker struct {
	Checker
}

func getUserToken(header http.Header) (string, error) {
	authValue := header.Get(AuthHeader)
	if authValue != "" {
		parts := strings.Split(authValue, "Bearer ")
		if len(parts) != 2 {
			return "", errors.New("missing Bearer token in Authorization header")
		}
		return parts[1], nil
	}
	return "", errors.New("missing Authorization header")
}

func (b *BearerTokenChecker) CheckAuth(ctx context.Context, header http.Header) error {
	hlog.Debug("Checking authenticated user")
	token, err := getUserToken(header)
	if err != nil {
		return err
	}
	hlog.Debug("Checking auth: token found")
	config, err := rest.InClusterConfig()
	if err != nil {
		return err
	}
	config.BearerToken = token
	config.BearerTokenFile = ""

	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		return err
	}
	hlog.Debug("Checking auth: kube config created")

	_, err = client.CoreV1().Namespaces().List(ctx, v1.ListOptions{})
	if err != nil {
		return err
	}

	hlog.Debug("Checking auth: passed")
	return nil
}
