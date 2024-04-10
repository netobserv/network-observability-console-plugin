package prometheus

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"

	"github.com/prometheus/client_golang/api"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
	pconf "github.com/prometheus/common/config"
	pmod "github.com/prometheus/common/model"
)

func NewClient(cfg *config.Prometheus, requestHeader http.Header) (api.Client, error) {
	maybeTLS := httpclient.NewTransport(cfg.Timeout.Duration, cfg.SkipTLS, cfg.CAPath, "", "")

	var roundTripper http.RoundTripper
	if cfg.ForwardUserToken && requestHeader != nil {
		h := requestHeader.Get(auth.AuthHeader)
		if h != "" && strings.HasPrefix(h, "Bearer ") {
			token := strings.TrimPrefix(h, "Bearer ")
			roundTripper = pconf.NewAuthorizationCredentialsRoundTripper("Bearer", pconf.Secret(token), maybeTLS)
		} else {
			log.Debug("Missing Authorization token in user request")
		}
	} else if cfg.TokenPath != "" {
		bytes, err := os.ReadFile(cfg.TokenPath)
		if err != nil {
			return nil, fmt.Errorf("failed to parse authorization path '%s': %w", cfg.TokenPath, err)
		}
		roundTripper = pconf.NewAuthorizationCredentialsRoundTripper("Bearer", pconf.Secret(string(bytes)), maybeTLS)
	} else {
		roundTripper = maybeTLS
	}

	return api.NewClient(api.Config{
		Address:      cfg.URL,
		RoundTripper: roundTripper,
	})
}

func executeQuery(ctx context.Context, cl api.Client, promQL string) (pmod.Value, error) {
	log.Debugf("executeQuery: promQL=%s", promQL)
	v1api := v1.NewAPI(cl)
	result, warnings, err := v1api.Query(ctx, promQL, time.Now())
	if err != nil {
		return nil, err
	}
	if len(warnings) > 0 {
		log.Infof("executeQuery warnings: %v", warnings)
	}
	log.Tracef("Result:\n%v", result)
	return result, nil
}

func executeQueryRange(ctx context.Context, cl api.Client, q *Query) (pmod.Value, int, error) {
	log.Debugf("executeQueryRange: %v; promQL=%s", q.Range, q.PromQL)
	v1api := v1.NewAPI(cl)
	result, warnings, err := v1api.QueryRange(ctx, q.PromQL, q.Range)
	if err != nil {
		return nil, http.StatusServiceUnavailable, err
	}
	if len(warnings) > 0 {
		log.Infof("executeQueryRange warnings: %v", warnings)
	}
	log.Tracef("Result:\n%v", result)
	return result, http.StatusOK, nil
}

func QueryMatrix(ctx context.Context, cl api.Client, q *Query) (model.QueryResponse, int, error) {
	resp, code, err := executeQueryRange(ctx, cl, q)
	if err != nil {
		log.WithError(err).Error("Error in executeQueryRange")
		return model.QueryResponse{}, code, err
	}
	// Transform response
	m, ok := resp.(pmod.Matrix)
	if !ok {
		err := fmt.Errorf("QueryMatrix: wrong return type: %T", resp)
		log.Error(err.Error())
		return model.QueryResponse{}, http.StatusInternalServerError, err
	}
	var convMatrix model.Matrix
	for i := range m {
		convMatrix = append(convMatrix, *m[i])
	}
	qr := model.QueryResponse{
		Data: model.QueryResponseData{
			ResultType: model.ResultTypeMatrix,
			Result:     convMatrix,
		},
	}
	return qr, code, nil
}
