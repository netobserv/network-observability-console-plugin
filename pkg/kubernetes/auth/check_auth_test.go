package auth

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/client"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	authv1 "k8s.io/api/authentication/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func setupChecker(typez CheckType, m *AuthCheckMock) Checker {
	checker, _ := NewChecker(typez, func() (client.KubeAPI, error) { return m, nil })
	return checker
}

func TestCheckAuth_NoAuth(t *testing.T) {
	m := AuthCheckMock{}
	m.mockNoAuth()

	// Any user authenticated mode
	checkAny := setupChecker(CheckAuthenticated, &m)

	// No header => fail
	err := checkAny.CheckAuth(context.TODO(), http.Header{})
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", err.Error())

	err = checkAny.CheckAuth(context.TODO(), http.Header{"Authorization": []string{"Bearer abcdef"}})
	require.Error(t, err)
	require.Equal(t, "user not authenticated", err.Error())

	// Admin mode
	checkerAdmin := setupChecker(CheckAdmin, &m)

	// No header => fail
	err = checkerAdmin.CheckAuth(context.TODO(), http.Header{})
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", err.Error())

	err = checkerAdmin.CheckAuth(context.TODO(), http.Header{"Authorization": []string{"Bearer abcdef"}})
	require.Error(t, err)
	require.Equal(t, "user not authenticated", err.Error())

	// Noop mode
	checkerNoop := NoopChecker{}

	// No header => success
	err = checkerNoop.CheckAuth(context.TODO(), http.Header{})
	require.NoError(t, err)
}

func TestCheckAuth_NormalUser(t *testing.T) {
	m := AuthCheckMock{}
	m.mockNormalUser()

	// Any user authenticated mode
	checkAny := setupChecker(CheckAuthenticated, &m)

	// No header => fail
	err := checkAny.CheckAuth(context.TODO(), http.Header{})
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", err.Error())

	err = checkAny.CheckAuth(context.TODO(), http.Header{"Authorization": []string{"Bearer abcdef"}})
	require.NoError(t, err)

	// Admin mode
	checkerAdmin := setupChecker(CheckAdmin, &m)

	// No header => fail
	err = checkerAdmin.CheckAuth(context.TODO(), http.Header{})
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", err.Error())

	err = checkerAdmin.CheckAuth(context.TODO(), http.Header{"Authorization": []string{"Bearer abcdef"}})
	require.Error(t, err)
	require.Equal(t, "user not an admin", err.Error())

	// Noop mode
	checkerNoop := NoopChecker{}

	// No header => success
	err = checkerNoop.CheckAuth(context.TODO(), http.Header{})
	require.NoError(t, err)
}

func TestCheckAuth_Admin(t *testing.T) {
	m := AuthCheckMock{}
	m.mockAdmin()

	// Any user authenticated mode
	checkAny := setupChecker(CheckAuthenticated, &m)

	// No header => fail
	err := checkAny.CheckAuth(context.TODO(), http.Header{})
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", err.Error())

	err = checkAny.CheckAuth(context.TODO(), http.Header{"Authorization": []string{"Bearer abcdef"}})
	require.NoError(t, err)

	// Admin mode
	checkerAdmin := setupChecker(CheckAdmin, &m)

	// No header => fail
	err = checkerAdmin.CheckAuth(context.TODO(), http.Header{})
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", err.Error())

	err = checkerAdmin.CheckAuth(context.TODO(), http.Header{"Authorization": []string{"Bearer abcdef"}})
	require.NoError(t, err)

	// Noop mode
	checkerNoop := NoopChecker{}

	// No header => success
	err = checkerNoop.CheckAuth(context.TODO(), http.Header{})
	require.NoError(t, err)
}

const fakeError = "an error occured"

func TestCheckAuth_APIError(t *testing.T) {
	m := AuthCheckMock{}
	m.mockError()

	// Any user authenticated mode
	checkAny := setupChecker(CheckAuthenticated, &m)

	// No header => fail
	err := checkAny.CheckAuth(context.TODO(), http.Header{})
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", err.Error())

	err = checkAny.CheckAuth(context.TODO(), http.Header{"Authorization": []string{"Bearer abcdef"}})
	require.Error(t, err)
	require.Equal(t, fakeError, err.Error())

	// Admin mode
	checkerAdmin := setupChecker(CheckAdmin, &m)

	// No header => fail
	err = checkerAdmin.CheckAuth(context.TODO(), http.Header{})
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", err.Error())

	err = checkerAdmin.CheckAuth(context.TODO(), http.Header{"Authorization": []string{"Bearer abcdef"}})
	require.Error(t, err)
	require.Equal(t, fakeError, err.Error())

	// Noop mode
	checkerNoop := NoopChecker{}

	// No header => success
	err = checkerNoop.CheckAuth(context.TODO(), http.Header{})
	require.NoError(t, err)
}

type AuthCheckMock struct {
	mock.Mock
	client.KubeAPI
}

func (m *AuthCheckMock) CreateTokenReview(ctx context.Context, tr *authv1.TokenReview, opts *metav1.CreateOptions) (*authv1.TokenReview, error) {
	args := m.Called(ctx, tr, opts)
	return args.Get(0).(*authv1.TokenReview), args.Error(1)
}

func (m *AuthCheckMock) CheckAdmin(ctx context.Context, token string) error {
	args := m.Called(ctx, token)
	return args.Error(0)
}

func (m *AuthCheckMock) mockError() {
	m.On("CreateTokenReview", mock.Anything, mock.Anything, mock.Anything).Return(&authv1.TokenReview{}, errors.New(fakeError))
}

func (m *AuthCheckMock) mockNoAuth() {
	m.On("CreateTokenReview", mock.Anything, mock.Anything, mock.Anything).Return(&authv1.TokenReview{
		Status: mockedTokenReviewStatus(false),
	}, nil)
	m.On("CheckAdmin", mock.Anything, mock.Anything).Return(errors.New("User is not an admin"))
}

func (m *AuthCheckMock) mockNormalUser() {
	m.On("CreateTokenReview", mock.Anything, mock.Anything, mock.Anything).Return(&authv1.TokenReview{
		Status: mockedTokenReviewStatus(true),
	}, nil)
	m.On("CheckAdmin", mock.Anything, mock.Anything).Return(errors.New("User is not an admin"))
}

func (m *AuthCheckMock) mockAdmin() {
	m.On("CreateTokenReview", mock.Anything, mock.Anything, mock.Anything).Return(&authv1.TokenReview{
		Status: mockedTokenReviewStatus(true),
	}, nil)
	m.On("CheckAdmin", mock.Anything, mock.Anything).Return(nil)
}

func mockedTokenReviewStatus(isAuth bool) authv1.TokenReviewStatus {
	st := authv1.TokenReviewStatus{
		Authenticated: isAuth,
		User: authv1.UserInfo{
			Username: "user1",
			Groups:   []string{"group1"},
		},
		Audiences: []string{"https://kubernetes.default.svc"},
	}
	if isAuth {
		st.User.Groups = append(st.User.Groups, "system:authenticated")
	}
	return st
}
