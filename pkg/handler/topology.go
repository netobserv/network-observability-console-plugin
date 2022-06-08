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
	metricFunctionKey = "function"
	metricTypeKey     = "type"
	scopeKey          = "scope"
	groupsKey         = "groups"
)

func GetTopology(cfg loki.Config) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(&cfg)

	return func(w http.ResponseWriter, r *http.Request) {
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetTopology", code, startTime)
		}()

		flows, code, err := getTopologyFlows(cfg, lokiClient, r.URL.Query())
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, flows)
	}
}

func getTopologyFlows(cfg loki.Config, client httpclient.Caller, params url.Values) (*model.AggregatedQueryResponse, int, error) {
	hlog.Debugf("GetTopology query params: %s", params)

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
	metricFunction := params.Get(metricFunctionKey)
	metricType := params.Get(metricTypeKey)
	reporter := params.Get(reporterKey)
	scope := params.Get(scopeKey)
	groups := params.Get(groupsKey)
	rawFilters := params.Get(filtersKey)
	filterGroups, err := parseFilters(rawFilters)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}

	merger := loki.NewMatrixMerger(reqLimit)
	if len(filterGroups) > 1 {
		// match any, and multiple filters => run in parallel then aggregate
		var queries []string
		for _, group := range filterGroups {
			query, code, err := buildTopologyQuery(&cfg, group, start, end, limit, metricFunction, metricType, reporter, scope, groups)
			if err != nil {
				return nil, code, errors.New("Can't build query: " + err.Error())
			}
			queries = append(queries, query)
		}
		code, err := fetchParallel(client, queries, merger)
		if err != nil {
			return nil, code, err
		}
	} else {
		// else, run all at once
		var filters [][]string
		if len(filterGroups) > 0 {
			filters = filterGroups[0]
		}
		query, code, err := buildTopologyQuery(&cfg, filters, start, end, limit, metricFunction, metricType, reporter, scope, groups)
		if err != nil {
			return nil, code, err
		}
		code, err = fetchSingle(client, query, merger)
		if err != nil {
			return nil, code, err
		}
	}

	qr := merger.Get()
	hlog.Tracef("GetTopology response: %v", qr)
	return qr, http.StatusOK, nil
}

func buildTopologyQuery(cfg *loki.Config, filters [][]string, start, end, limit, metricFunction, metricType, reporter, scope, groups string) (string, int, error) {
	qb, err := loki.NewTopologyQuery(cfg, start, end, limit, metricFunction, metricType, reporter, scope, groups)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	err = qb.Filters(filters)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	return EncodeQuery(qb.Build()), http.StatusOK, nil
}
