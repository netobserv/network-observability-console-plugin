package handler

import (
	"errors"
	"net/http"
	"net/url"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

const (
	metricStep        = "step"
	metricFunctionKey = "function"
	metricTypeKey     = "type"
	scopeKey          = "scope"
	groupsKey         = "groups"
)

func GetMetrics(cfg *loki.Config) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(cfg)

	return func(w http.ResponseWriter, r *http.Request) {
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetMetrics", code, startTime)
		}()

		flows, code, err := getMetricsFlows(cfg, lokiClient, r.URL.Query())
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, flows)
	}
}

func getMetricsFlows(cfg *loki.Config, client httpclient.Caller, params url.Values) (*model.AggregatedQueryResponse, int, error) {
	hlog.Debugf("GetMetrics query params: %s", params)

	start, err := getStartTime(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	end, err := getEndTime(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	limit, reqLimit, err := getLimit(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	step := params.Get((metricStep))
	metricFunction := params.Get(metricFunctionKey)
	metricType := params.Get(metricTypeKey)
	reporter := params.Get(reporterKey)
	layer := params.Get(layerKey)
	scope := params.Get(scopeKey)
	groups := params.Get(groupsKey)
	rawFilters := params.Get(filtersKey)
	filterGroups, err := parseFilters(rawFilters)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}

	merger := loki.NewMatrixMerger(reqLimit)
	var queries []string

	if len(filterGroups) > 1 {
		// match any, and multiple filters => run in parallel then aggregate
		for _, group := range filterGroups {
			query, code, err := buildMetricsQuery(cfg, group, start, end, limit, step, metricFunction, metricType, reporter, layer, scope, groups)
			if err != nil {
				return nil, code, errors.New("Can't build query: " + err.Error())
			}
			queries = append(queries, query)

			appQuery, appCode, appErr := buildMetricsQuery(cfg, group, start, end, "1", step, metricFunction, metricType, reporter, layer, "app", "")
			if appErr != nil {
				return nil, appCode, errors.New("Can't build 'app' query: " + appErr.Error())
			}
			queries = append(queries, appQuery)
		}

	} else {
		// else, run all at once
		var filters [][]string
		if len(filterGroups) > 0 {
			filters = filterGroups[0]
		}
		query, code, err := buildMetricsQuery(cfg, filters, start, end, limit, step, metricFunction, metricType, reporter, layer, scope, groups)
		if err != nil {
			return nil, code, err
		}
		queries = append(queries, query)

		appQuery, appCode, appErr := buildMetricsQuery(cfg, filters, start, end, "1", step, metricFunction, metricType, reporter, layer, "app", "")
		if appErr != nil {
			return nil, appCode, errors.New("Can't build 'app' query: " + appErr.Error())
		}
		queries = append(queries, appQuery)
	}

	code, err := fetchParallel(client, queries, merger)
	if err != nil {
		return nil, code, err
	}

	qr := merger.Get()
	hlog.Tracef("GetMetrics response: %v", qr)
	return qr, http.StatusOK, nil
}

func buildMetricsQuery(cfg *loki.Config, filters [][]string, start, end, limit, step, metricFunction, metricType, reporter, layer, scope, groups string) (string, int, error) {
	qb, err := loki.NewMetricsQuery(cfg, start, end, limit, step, metricFunction, metricType, reporter, layer, scope, groups)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	err = qb.Filters(filters)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	return EncodeQuery(qb.Build()), http.StatusOK, nil
}
