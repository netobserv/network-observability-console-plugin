package handler

import (
	"errors"
	"net/http"
	"net/url"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
)

func GetTopology(cfg loki.Config) func(w http.ResponseWriter, r *http.Request) {
	lokiClient := newLokiClient(&cfg)

	return func(w http.ResponseWriter, r *http.Request) {
		flows, code, err := getTopologyFlows(cfg, lokiClient, r.URL.Query())
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		writeRawJSON(w, http.StatusOK, flows)
	}
}

func getTopologyFlows(cfg loki.Config, client httpclient.HTTPClient, params url.Values) ([]byte, int, error) {
	hlog.Debugf("GetTopology query params: %s", params)

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
			query, code, err := buildTopologyQuery(&cfg, group, start, end, limit, reporter)
			if err != nil {
				return nil, code, errors.New("Can't build query: " + err.Error())
			}
			queries = append(queries, query)
		}
		res, code, err := fetchParallel(client, queries)
		if err != nil {
			return nil, code, errors.New("Error while fetching flows from Loki: " + err.Error())
		}
		rawJSON = res
	} else {
		// else, run all at once
		var filters map[string]string
		if len(filterGroups) > 0 {
			filters = filterGroups[0]
		}
		query, code, err := buildTopologyQuery(&cfg, filters, start, end, limit, reporter)
		if err != nil {
			return nil, code, err
		}
		resp, code, err := executeLokiQuery(query, client)
		if err != nil {
			return nil, code, errors.New("Error while fetching flows from Loki: " + err.Error())
		}
		rawJSON = resp
	}

	hlog.Tracef("GetTopology raw response: %v", rawJSON)
	return rawJSON, http.StatusOK, nil
}

func buildTopologyQuery(cfg *loki.Config, filters map[string]string, start, end, limit, reporter string) (string, int, error) {
	qb, err := loki.NewTopologyQuery(cfg, start, end, limit, reporter)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	err = qb.Filters(filters)
	if err != nil {
		return "", http.StatusBadRequest, err
	}
	return EncodeQuery(qb.Build()), http.StatusOK, nil
}
