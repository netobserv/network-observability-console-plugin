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
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

const (
	metricTypeKey   = "type"
	scopeKey        = "scope"
	groupsKey       = "groups"
	rateIntervalKey = "rateInterval"
	stepKey         = "step"

	defaultRateInterval = "1m"
	defaultStep         = "30s"
)

func GetTopology(cfg *loki.Config) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header, false)
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

func getTopologyFlows(cfg *loki.Config, client httpclient.Caller, params url.Values) (*model.AggregatedQueryResponse, int, error) {
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
	rateInterval := params.Get(rateIntervalKey)
	if rateInterval == "" {
		rateInterval = defaultRateInterval
	}
	step := params.Get(stepKey)
	if step == "" {
		step = defaultStep
	}
	metricType := params.Get(metricTypeKey)
	reporter := constants.Reporter(params.Get(reporterKey))
	recordType := constants.RecordType(params.Get(recordTypeKey))
	packetLoss := constants.PacketLoss(params.Get(packetLossKey))
	scope := params.Get(scopeKey)
	groups := params.Get(groupsKey)
	rawFilters := params.Get(filtersKey)
	filterGroups, err := filters.Parse(rawFilters)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}

	merger := loki.NewMatrixMerger(reqLimit)
	if len(filterGroups) > 1 {
		// match any, and multiple filters => run in parallel then aggregate
		var queries []string
		for _, group := range filterGroups {
			query, code, err := buildTopologyQuery(cfg, group, start, end, limit, rateInterval, step, metricType, recordType, reporter, packetLoss, scope, groups)
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
		var filters filters.SingleQuery
		if len(filterGroups) > 0 {
			filters = filterGroups[0]
		}
		query, code, err := buildTopologyQuery(cfg, filters, start, end, limit, rateInterval, step, metricType, recordType, reporter, packetLoss, scope, groups)
		if err != nil {
			return nil, code, err
		}
		code, err = fetchSingle(client, query, merger)
		if err != nil {
			return nil, code, err
		}
	}

	qr := merger.Get()
	qr.IsMock = cfg.UseMocks
	qr.UnixTimestamp = time.Now().Unix()
	hlog.Tracef("GetTopology response: %v", qr)
	return qr, http.StatusOK, nil
}

func buildTopologyQuery(cfg *loki.Config, queryFilters filters.SingleQuery, start, end, limit, rateInterval, step, metricType string, recordType constants.RecordType, reporter constants.Reporter, packetLoss constants.PacketLoss, scope, groups string) (string, int, error) {
	qb, err := loki.NewTopologyQuery(cfg, start, end, limit, rateInterval, step, metricType, recordType, reporter, packetLoss, scope, groups)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	err = qb.Filters(queryFilters)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	return EncodeQuery(qb.Build()), http.StatusOK, nil
}
