package handler

import (
	"context"
	"errors"
	"net/http"
	"net/url"
	"slices"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

const (
	startTimeKey  = "startTime"
	endTimeKey    = "endTime"
	timeRangeKey  = "timeRange"
	limitKey      = "limit"
	dedupKey      = "dedup"
	recordTypeKey = "recordType"
	dataSourceKey = "dataSource"
	filtersKey    = "filters"
	packetLossKey = "packetLoss"
	namespaceKey  = "namespace"
)

func (h *Handlers) GetFlows(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.Cfg.IsLokiEnabled() {
			writeError(w, http.StatusBadRequest, "Cannot perform flows query with disabled Loki")
			return
		}

		cl := newLokiClient(&h.Cfg.Loki, r.Header, false)
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetFlows", code, startTime)
		}()

		params := r.URL.Query()
		hlog.Debugf("GetFlows query params: %s", params)

		flows, code, err := h.getFlows(ctx, cl, params)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, flows)
	}
}

func (h *Handlers) getFlows(ctx context.Context, lokiClient httpclient.Caller, params url.Values) (*model.AggregatedQueryResponse, int, error) {
	start, _, err := getStartTime(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	end, _, err := getEndTime(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	limit, reqLimit, err := getLimit(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	recordType, err := getRecordType(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	dedup := params.Get(dedupKey) == "true"
	if !h.Cfg.Frontend.Deduper.Mark || slices.Contains(constants.AnyConnectionType, string(recordType)) {
		dedup = false
	}
	packetLoss, err := getPacketLoss(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	namespace := params.Get(namespaceKey)
	rawFilters := params.Get(filtersKey)
	filterGroups, err := filters.Parse(rawFilters, namespace)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}

	cl := clients{loki: lokiClient}
	merger := loki.NewStreamMerger(reqLimit)
	if len(filterGroups) > 1 {
		// match any, and multiple filters => run in parallel then aggregate
		var queries []string
		for _, group := range filterGroups {
			qb := loki.NewFlowQueryBuilder(&h.Cfg.Loki, start, end, limit, dedup, recordType, packetLoss)
			err := qb.Filters(group)
			if err != nil {
				return nil, http.StatusBadRequest, errors.New("Can't build query: " + err.Error())
			}
			queries = append(queries, qb.Build())
		}
		code, err := cl.fetchParallel(ctx, queries, nil, merger)
		if err != nil {
			return nil, code, err
		}
	} else {
		// else, run all at once
		qb := loki.NewFlowQueryBuilder(&h.Cfg.Loki, start, end, limit, dedup, recordType, packetLoss)
		if len(filterGroups) > 0 {
			err := qb.Filters(filterGroups[0])
			if err != nil {
				return nil, http.StatusBadRequest, err
			}
		}
		query := qb.Build()
		code, err := cl.fetchSingle(ctx, query, nil, merger)
		if err != nil {
			return nil, code, err
		}
	}

	qr := merger.Get()
	hlog.Tracef("GetFlows response: %v", qr)
	return qr, http.StatusOK, nil
}
