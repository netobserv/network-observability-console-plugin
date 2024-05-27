package handler

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/prometheus"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
	"github.com/prometheus/client_golang/api"
)

type clients struct {
	loki httpclient.Caller
	prom api.Client
}

func newClients(cfg *config.Config, requestHeader http.Header, useLokiStatus bool) (clients, error) {
	var lokiClient httpclient.Caller
	var promClient api.Client
	var err error
	if cfg.IsLokiEnabled() {
		lokiClient = newLokiClient(&cfg.Loki, requestHeader, useLokiStatus)
	}
	if cfg.IsPromEnabled() {
		promClient, err = prometheus.NewClient(&cfg.Prometheus, requestHeader)
	}
	return clients{loki: lokiClient, prom: promClient}, err
}

type datasourceError struct {
	datasource constants.DataSource
	nested     error
}

func (e *datasourceError) Error() string {
	return e.nested.Error()
}

func (c *clients) fetchLokiSingle(logQL string, merger loki.Merger) (int, error) {
	qr, code, err := fetchLogQL(logQL, c.loki)
	if err != nil {
		return code, &datasourceError{datasource: constants.DataSourceLoki, nested: err}
	}
	if _, err := merger.Add(qr.Data); err != nil {
		return http.StatusInternalServerError, &datasourceError{datasource: constants.DataSourceLoki, nested: err}
	}
	return code, nil
}

func (c *clients) fetchPrometheusSingle(ctx context.Context, promQL *prometheus.Query, merger loki.Merger) (int, error) {
	qr, code, err := prometheus.QueryMatrix(ctx, c.prom, promQL)
	if err != nil {
		return code, &datasourceError{datasource: constants.DataSourceProm, nested: err}
	}
	if _, err := merger.Add(qr.Data); err != nil {
		return http.StatusInternalServerError, &datasourceError{datasource: constants.DataSourceProm, nested: err}
	}
	return code, nil
}

func (c *clients) fetchSingle(ctx context.Context, logQL string, promQL *prometheus.Query, merger loki.Merger) (int, error) {
	if promQL != nil {
		if c.prom == nil {
			return http.StatusBadRequest, fmt.Errorf("cannot execute the following Prometheus query: Prometheus is disabled: %v", promQL.PromQL)
		}
		return c.fetchPrometheusSingle(ctx, promQL, merger)
	}
	if c.loki == nil {
		return http.StatusBadRequest, fmt.Errorf("cannot execute the following Loki query: Loki is disabled: %v", logQL)
	}
	return c.fetchLokiSingle(logQL, merger)
}

func (c *clients) fetchParallel(ctx context.Context, logQL []string, promQL []*prometheus.Query, merger loki.Merger) (int, error) {
	if c.loki == nil && len(logQL) > 0 {
		hlog.Errorf("Cannot execute the following Loki queries: Loki is disabled: %v", logQL)
		logQL = nil
	}

	if c.prom == nil && len(promQL) > 0 {
		hlog.Errorf("Cannot execute the following Prometheus queries: Prometheus is disabled: %v", promQL[0].PromQL)
		promQL = nil
	}

	// Run queries in parallel, then aggregate them
	size := len(logQL) + len(promQL)
	if size == 0 {
		return http.StatusBadRequest, errors.New("no queries could be executed")
	}

	resChan := make(chan model.QueryResponse, size)
	errChan := make(chan errorWithCode, size)
	var wg sync.WaitGroup
	wg.Add(size)

	for _, q := range logQL {
		go func(query string) {
			defer wg.Done()
			qr, code, err := fetchLogQL(query, c.loki)
			if err != nil {
				errChan <- errorWithCode{err: &datasourceError{datasource: constants.DataSourceLoki, nested: err}, code: code}
			} else {
				resChan <- qr
			}
		}(q)
	}

	for _, q := range promQL {
		go func(query *prometheus.Query) {
			defer wg.Done()
			qr, code, err := prometheus.QueryMatrix(ctx, c.prom, query)
			if err != nil {
				errChan <- errorWithCode{err: &datasourceError{datasource: constants.DataSourceProm, nested: err}, code: code}
			} else {
				resChan <- qr
			}
		}(q)
	}

	wg.Wait()
	close(resChan)
	close(errChan)

	for errWithCode := range errChan {
		return errWithCode.code, errWithCode.err
	}

	// Aggregate results
	for r := range resChan {
		if _, err := merger.Add(r.Data); err != nil {
			return http.StatusInternalServerError, err
		}
	}
	return http.StatusOK, nil
}
