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

func NewChecker(typez CheckType) (Checker, error) {
	switch typez {
	case CheckNone:
		return &NoopChecker{}, nil
	case CheckAuthenticated:
		return &ValidBearerTokenChecker{apiProvider: client.NewInCluster}, nil
	case CheckAdmin:
		return &AdminBearerTokenChecker{apiProvider: client.NewInCluster}, nil
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

func runTokenReview(ctx context.Context, apiProvider client.APIProvider, token string, preds []tokenReviewPredicate) error {
	client, err := apiProvider()
	if err != nil {
		return err
	}

	rvw, err := client.CreateTokenReview(ctx, &authv1.TokenReview{
		Spec: authv1.TokenReviewSpec{
			Token: token,
		},
	}, &metav1.CreateOptions{})
	if err != nil {
		return err
	}
	for _, predFunc := range preds {
		if err = predFunc(rvw); err != nil {
			return err
		}
	}
	return nil
}

type tokenReviewPredicate func(*authv1.TokenReview) error

func mustBeAuthenticated(rvw *authv1.TokenReview) error {
	if !rvw.Status.Authenticated {
		return errors.New("user not authenticated")
	}
	return nil
}

func mustBeClusterAdmin(rvw *authv1.TokenReview) error {
	for _, group := range rvw.Status.User.Groups {
		if group == "system:cluster-admins" {
			return nil
		}
	}
	return errors.New("user not in cluster-admins group")
}

type ValidBearerTokenChecker struct {
	Checker
	apiProvider client.APIProvider
}

func (c *ValidBearerTokenChecker) CheckAuth(ctx context.Context, header http.Header) error {
	hlog.Debug("Checking authenticated user")
	token, err := getUserToken(header)
	if err != nil {
		return err
	}
	hlog.Debug("Checking auth: token found")
	if err = runTokenReview(ctx, c.apiProvider, token, []tokenReviewPredicate{mustBeAuthenticated}); err != nil {
		return err
	}

	hlog.Debug("Checking auth: passed")
	return nil
}

type AdminBearerTokenChecker struct {
	Checker
	apiProvider client.APIProvider
}

func (c *AdminBearerTokenChecker) CheckAuth(ctx context.Context, header http.Header) error {
	hlog.Debug("Checking authenticated user")
	token, err := getUserToken(header)
	if err != nil {
		return err
	}
	hlog.Debug("Checking auth: token found")
	if err = runTokenReview(ctx, c.apiProvider, token, []tokenReviewPredicate{mustBeAuthenticated, mustBeClusterAdmin}); err != nil {
		return err
	}

	hlog.Debug("Checking auth: passed")
	return nil
}
