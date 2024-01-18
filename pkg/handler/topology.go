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
	metricTypeKey     = "type"
	metricFunctionKey = "function"

	aggregateByKey  = "aggregateBy"
	groupsKey       = "groups"
	rateIntervalKey = "rateInterval"
	stepKey         = "step"

	defaultRateInterval = "1m"
	defaultStep         = "30s"
)

func GetTopology(cfg *loki.Config, version, date, filename string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		config, err := ReadConfigFile(version, date, filename)
		if err != nil {
			hlog.Errorf("Could not read frontend-config file: %v", err)
		}

		lokiClient := newLokiClient(cfg, r.Header, false)
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetTopology", code, startTime)
		}()

		flows, code, err := getTopologyFlows(cfg, lokiClient, r.URL.Query(), &config.Frontend)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, flows)
	}
}

func getTopologyFlows(cfg *loki.Config, client httpclient.Caller, params url.Values, frontendConfig *Frontend) (*model.AggregatedQueryResponse, int, error) {
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
	rateInterval, err := getRateInterval(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	step, err := getStep(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	metricType, err := getMetricType(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	metricFunction, err := getMetricFunction(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	recordType, err := getRecordType(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	packetLoss, err := getPacketLoss(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	aggregate := params.Get(aggregateByKey)
	groups := params.Get(groupsKey)
	rawFilters := params.Get(filtersKey)
	filterGroups, err := filters.Parse(rawFilters)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	if shouldMergeReporters(metricType, frontendConfig.Deduper.Merge) {
		filterGroups = expandReportersMergeQueries(filterGroups)
	}

	merger := loki.NewMatrixMerger(reqLimit)
	if len(filterGroups) > 1 {
		// match any, and multiple filters => run in parallel then aggregate
		var queries []string
		for _, group := range filterGroups {
			query, code, err := buildTopologyQuery(cfg, group, start, end, limit, rateInterval, step, metricType, metricFunction, recordType, packetLoss, aggregate, groups)
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
		query, code, err := buildTopologyQuery(cfg, filters, start, end, limit, rateInterval, step, metricType, metricFunction, recordType, packetLoss, aggregate, groups)
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

func shouldMergeReporters(metricType constants.MetricType, deduperMerge bool) bool {
	return !deduperMerge && (metricType == constants.MetricTypeBytes ||
		metricType == constants.MetricTypePackets)
}

func expandReportersMergeQueries(queries filters.MultiQueries) filters.MultiQueries {
	var out filters.MultiQueries
	for _, q := range queries {
		q1, q2 := filters.SplitForReportersMerge(q)
		if q1 != nil {
			out = append(out, q1)
		}
		if q2 != nil {
			out = append(out, q2)
		}
	}
	return out
}

func buildTopologyQuery(cfg *loki.Config, queryFilters filters.SingleQuery, start, end, limit, rateInterval, step string, metricType constants.MetricType, metricFunction constants.MetricFunction, recordType constants.RecordType, packetLoss constants.PacketLoss, aggregate, groups string) (string, int, error) {
	qb, err := loki.NewTopologyQuery(cfg, start, end, limit, rateInterval, step, metricType, metricFunction, recordType, packetLoss, aggregate, groups)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	err = qb.Filters(queryFilters)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	return EncodeQuery(qb.Build()), http.StatusOK, nil
}
