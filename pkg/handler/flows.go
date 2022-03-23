package handler

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
)

const (
	startTimeKey = "startTime"
	endTimeKey   = "endTime"
	timeRangeKey = "timeRange"
	limitKey     = "limit"
	reporterKey  = "reporter"
	filtersKey   = "filters"
)

type errorWithCode struct {
	err  error
	code int
}

// Example of raw filters (url-encoded):
// foo=a,b&bar=c|baz=d
func parseFilters(raw string) ([]map[string]string, error) {
	var parsed []map[string]string
	decoded, err := url.QueryUnescape(raw)
	if err != nil {
		return nil, err
	}
	groups := strings.Split(decoded, "|")
	for _, group := range groups {
		m := make(map[string]string)
		parsed = append(parsed, m)
		filters := strings.Split(group, "&")
		for _, filter := range filters {
			pair := strings.Split(filter, "=")
			if len(pair) == 2 {
				m[pair[0]] = pair[1]
			}
		}
	}
	return parsed, nil
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
	}
	return start, nil
}

func GetFlows(cfg loki.Config) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(&cfg)

	return func(w http.ResponseWriter, r *http.Request) {
		flows, code, err := getFlows(cfg, lokiClient, r.URL.Query())
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		writeRawJSON(w, http.StatusOK, flows)
	}
}

func getFlows(cfg loki.Config, client httpclient.HTTPClient, params url.Values) ([]byte, int, error) {
	hlog.Debugf("getFlows query params: %s", params)

	start, err := getStartTime(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	end := params.Get(endTimeKey)
	limit := params.Get(limitKey)
	reporter := params.Get(reporterKey)
	rawFilters := params.Get(filtersKey)
	filterGroups, err := parseFilters(rawFilters)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}

	var rawJSON []byte
	if len(filterGroups) > 1 {
		// match any, and multiple filters => run in parallel then aggregate
		var queries []string
		for _, group := range filterGroups {
			qb := loki.NewFlowQueryBuilder(&cfg, start, end, limit, reporter)
			err := qb.Filters(group)
			if err != nil {
				return nil, http.StatusBadRequest, errors.New("Can't build query: " + err.Error())
			}
			queries = append(queries, qb.Build())
		}
		res, code, err := fetchParallel(client, queries)
		if err != nil {
			return nil, code, errors.New("Error while fetching flows from Loki: " + err.Error())
		}
		rawJSON = res
	} else {
		// else, run all at once
		qb := loki.NewFlowQueryBuilder(&cfg, start, end, limit, reporter)
		if len(filterGroups) > 0 {
			err := qb.Filters(filterGroups[0])
			if err != nil {
				return nil, http.StatusBadRequest, err
			}
		}
		query := qb.Build()
		resp, code, err := executeLokiQuery(query, client)
		if err != nil {
			return nil, code, errors.New("Error while fetching flows from Loki: " + err.Error())
		}
		rawJSON = resp
	}

	hlog.Tracef("GetFlows raw response: %v", rawJSON)
	return rawJSON, http.StatusOK, nil
}
