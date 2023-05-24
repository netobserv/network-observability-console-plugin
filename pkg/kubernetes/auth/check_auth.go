package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/client"
	"github.com/sirupsen/logrus"
	authv1 "k8s.io/api/authentication/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var hlog = logrus.WithField("module", "handler.auth")

type CheckType string

const (
	AuthHeader                   = "Authorization"
	CheckAuthenticated CheckType = "authenticated"
	CheckAdmin         CheckType = "admin"
	CheckNone          CheckType = "none"
)

type Checker interface {
	CheckAuth(ctx context.Context, header http.Header) error
}

func NewChecker(typez CheckType, apiProvider client.APIProvider) (Checker, error) {
	switch typez {
	case CheckNone:
		return &NoopChecker{}, nil
	case CheckAuthenticated:
		return &BearerTokenChecker{apiProvider: apiProvider, predicates: []authPredicate{mustBeAuthenticated}}, nil
	case CheckAdmin:
		return &BearerTokenChecker{apiProvider: apiProvider, predicates: []authPredicate{mustBeAuthenticated, mustBeClusterAdmin}}, nil
	}
	return nil, fmt.Errorf("auth checker type unknown: %s. Must be one of %s, %s, %s", typez, CheckAdmin, CheckAuthenticated, CheckNone)
}

type NoopChecker struct {
	Checker
}

func (b *NoopChecker) CheckAuth(ctx context.Context, header http.Header) error {
	hlog.Debug("noop auth checker: ignore auth")
	return nil
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

func runTokenReview(ctx context.Context, apiProvider client.APIProvider, token string, preds []authPredicate) error {
	client, err := apiProvider()
	if err != nil {
		return err
	}
	for _, predFunc := range preds {
		if err = predFunc(ctx, client, token); err != nil {
			return err
		}
	}
	return nil
}

type authPredicate func(context.Context, client.KubeAPI, string) error

func mustBeAuthenticated(ctx context.Context, cl client.KubeAPI, token string) error {
	rvw, err := cl.CreateTokenReview(ctx, &authv1.TokenReview{
		Spec: authv1.TokenReviewSpec{
			Token: token,
		},
	}, &metav1.CreateOptions{})
	if err != nil {
		return err
	}
	if !rvw.Status.Authenticated {
		return errors.New("user not authenticated")
	}
	return nil
}

func mustBeClusterAdmin(ctx context.Context, cl client.KubeAPI, token string) error {
	if err := cl.CheckAdmin(ctx, token); err != nil {
		return errors.New("user not an admin")
	}
	return nil
}

type BearerTokenChecker struct {
	Checker
	apiProvider client.APIProvider
	predicates  []authPredicate
}

func (c *BearerTokenChecker) CheckAuth(ctx context.Context, header http.Header) error {
	hlog.Debug("Checking authenticated user")
	token, err := getUserToken(header)
	if err != nil {
		return err
	}
	hlog.Debug("Checking auth: token found")
	if err = runTokenReview(ctx, c.apiProvider, token, c.predicates); err != nil {
		return err
	}

	hlog.Debug("Checking auth: passed")
	return nil
}
