package handler

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
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
	reporterKey   = "reporter"
	recordTypeKey = "recordType"
	filtersKey    = "filters"
	packetLossKey = "packetLoss"
)

type errorWithCode struct {
	err  error
	code int
}

func getStartTime(params url.Values) (string, error) {
	start := params.Get(startTimeKey)
	if len(start) == 0 {
		tr := params.Get(timeRangeKey)
		if len(tr) > 0 {
			r, err := strconv.ParseInt(tr, 10, 64)
			if err != nil {
				return "", errors.New("Could not parse time range: " + err.Error())
			}
			start = strconv.FormatInt(time.Now().Unix()-r, 10)
		}
	} else {
		// Make sure it is a valid int
		_, err := strconv.ParseInt(start, 10, 64)
		if err != nil {
			return "", errors.New("Could not parse start time: " + err.Error())
		}
	}
	return start, nil
}

// getEndTime will parse end time and ceil it to the next second
func getEndTime(params url.Values) (string, error) {
	end := params.Get(endTimeKey)
	if len(end) > 0 {
		r, err := strconv.ParseInt(end, 10, 64)
		if err != nil {
			return "", errors.New("Could not parse end time: " + err.Error())
		}
		end = strconv.Itoa(int(r) + 1)
	}
	return end, nil
}

// getLimit returns limit as string (used for logQL) and as int (used to check if reached)
func getLimit(params url.Values) (string, int, error) {
	limit := params.Get(limitKey)
	var reqLimit int
	if len(limit) > 0 {
		l, err := strconv.ParseInt(limit, 10, 64)
		if err != nil {
			return "", 0, errors.New("Could not parse limit: " + err.Error())
		}
		reqLimit = int(l)
	}
	return limit, reqLimit, nil
}

func GetFlows(cfg *loki.Config) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lokiClient := newLokiClient(cfg, r.Header, false)
		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetFlows", code, startTime)
		}()

		params := r.URL.Query()
		hlog.Debugf("GetFlows query params: %s", params)

		flows, code, err := getFlows(cfg, lokiClient, params)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, flows)
	}
}

func getFlows(cfg *loki.Config, client httpclient.Caller, params url.Values) (*model.AggregatedQueryResponse, int, error) {
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
	reporter := constants.Reporter(params.Get(reporterKey))
	recordType := constants.RecordType(params.Get(recordTypeKey))
	packetLoss := constants.PacketLoss(params.Get(packetLossKey))
	rawFilters := params.Get(filtersKey)
	filterGroups, err := filters.Parse(rawFilters)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}

	merger := loki.NewStreamMerger(reqLimit)
	if len(filterGroups) > 1 {
		// match any, and multiple filters => run in parallel then aggregate
		var queries []string
		for _, group := range filterGroups {
			qb := loki.NewFlowQueryBuilder(cfg, start, end, limit, reporter, recordType, packetLoss)
			err := qb.Filters(group)
			if err != nil {
				return nil, http.StatusBadRequest, errors.New("Can't build query: " + err.Error())
			}
			queries = append(queries, qb.Build())
		}
		code, err := fetchParallel(client, queries, merger)
		if err != nil {
			return nil, code, err
		}
	} else {
		// else, run all at once
		qb := loki.NewFlowQueryBuilder(cfg, start, end, limit, reporter, recordType, packetLoss)
		if len(filterGroups) > 0 {
			err := qb.Filters(filterGroups[0])
			if err != nil {
				return nil, http.StatusBadRequest, err
			}
		}
		query := qb.Build()
		code, err := fetchSingle(client, query, merger)
		if err != nil {
			return nil, code, err
		}
	}

	qr := merger.Get()
	hlog.Tracef("GetFlows response: %v", qr)
	return qr, http.StatusOK, nil
}
