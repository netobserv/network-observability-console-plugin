package handler

import (
	"context"
	"errors"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/prometheus"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"

	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
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
	defaultStepDuration = time.Second * 30
)

func (h *Handlers) GetTopology(ctx context.Context) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		clients, err := newClients(h.Cfg, r.Header, false)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		var code int
		startTime := time.Now()
		defer func() {
			metrics.ObserveHTTPCall("GetTopology", code, startTime)
		}()

		flows, code, err := h.getTopologyFlows(ctx, clients, r.URL.Query())
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		code = http.StatusOK
		writeJSON(w, code, flows)
	}
}

func (h *Handlers) getTopologyFlows(ctx context.Context, cl clients, params url.Values) (*model.AggregatedQueryResponse, int, error) {
	hlog.Debugf("GetTopology query params: %s", params)
	in := loki.TopologyInput{DedupMark: h.Cfg.Frontend.Deduper.Mark}
	var err error
	qr := v1.Range{}

	dataSources := make(map[constants.DataSource]bool)
	if h.Cfg.Loki.UseMocks {
		dataSources["mock"] = true
	}

	in.Start, qr.Start, err = getStartTime(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.End, qr.End, err = getEndTime(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	var reqLimit int
	in.Top, reqLimit, err = getLimit(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.RateInterval, err = getRateInterval(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.Step, qr.Step, err = getStep(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.DataField = getMetricType(params)
	in.MetricFunction, err = getMetricFunction(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.RecordType, err = getRecordType(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.DataSource, err = getDatasource(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.PacketLoss, err = getPacketLoss(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.Aggregate, err = getAggregate(params)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}
	in.Groups = params.Get(groupsKey)
	rawFilters := params.Get(filtersKey)
	filterGroups, err := filters.Parse(rawFilters)
	if err != nil {
		return nil, http.StatusBadRequest, err
	}

	if shouldMergeReporters(in.DataField) {
		filterGroups = expandReportersMergeQueries(
			filterGroups,
			func(filters filters.SingleQuery) bool {
				m, _ := getEligiblePromMetric(h.PromInventory, filters, &in)
				return m != ""
			},
		)
	}

	merger := loki.NewMatrixMerger(reqLimit)
	if len(filterGroups) > 1 {
		// match any, and multiple filters => run in parallel then aggregate
		var lokiQ []string
		var promQ []*prometheus.Query
		for _, filters := range filterGroups {
			lq, pq, code, err := buildTopologyQuery(h.Cfg, h.PromInventory, filters, &in, &qr)
			if err != nil {
				return nil, code, errors.New("Can't build query: " + err.Error())
			}
			if pq != nil {
				promQ = append(promQ, pq)
				dataSources[constants.DataSourceProm] = true
			} else {
				lokiQ = append(lokiQ, lq)
				dataSources[constants.DataSourceLoki] = true
			}
		}
		code, err := cl.fetchParallel(ctx, lokiQ, promQ, merger)
		if err != nil {
			return nil, code, err
		}
	} else {
		// else, run all at once
		var filters filters.SingleQuery
		if len(filterGroups) > 0 {
			filters = filterGroups[0]
		}
		lokiQ, promQ, code, err := buildTopologyQuery(h.Cfg, h.PromInventory, filters, &in, &qr)
		if err != nil {
			return nil, code, err
		}
		if len(lokiQ) > 0 {
			dataSources[constants.DataSourceLoki] = true
		}
		if promQ != nil {
			dataSources[constants.DataSourceProm] = true
		}
		code, err = cl.fetchSingle(ctx, lokiQ, promQ, merger)
		if err != nil {
			return nil, code, err
		}
	}

	qresp := merger.Get()
	qresp.DataSources = []constants.DataSource{}
	for str, ok := range dataSources {
		if ok {
			qresp.DataSources = append(qresp.DataSources, str)
		}
	}
	qresp.UnixTimestamp = time.Now().Unix()
	hlog.Tracef("GetTopology response: %v", qresp)
	return qresp, http.StatusOK, nil
}

func shouldMergeReporters(metricType string) bool {
	return metricType == constants.MetricTypeBytes || metricType == constants.MetricTypePackets
}

func expandReportersMergeQueries(queries filters.MultiQueries, isForProm func(filters filters.SingleQuery) bool) filters.MultiQueries {
	var out filters.MultiQueries
	for _, q := range queries {
		// Do not expand if this is managed from prometheus
		if isForProm(q) {
			out = append(out, q)
			continue
		}
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

func buildTopologyQuery(
	cfg *config.Config,
	promInventory *prometheus.Inventory,
	filters filters.SingleQuery,
	in *loki.TopologyInput,
	qr *v1.Range,
) (string, *prometheus.Query, int, error) {
	metric, candidates := getEligiblePromMetric(promInventory, filters, in)
	if metric != "" {
		qb := prometheus.NewQuery(in, qr, filters, metric)
		q := qb.Build()
		return "", &q, http.StatusOK, nil
	}

	if !cfg.IsLokiEnabled() || in.DataSource == constants.DataSourceProm {
		if len(candidates) > 0 {
			// Some candidate metrics exist but they are disabled; tell the user
			return "", nil, http.StatusBadRequest, errors.New(
				"this request requires any of the following metric(s) to be enabled: " + strings.Join(candidates, ", ") +
					". Metrics can be configured in the FlowCollector resource via 'spec.processor.metrics.includeList'" +
					" Alternatively, you may also install and enable Loki.")
		}
		return "", nil, http.StatusBadRequest, errors.New("this request could not be performed with Prometheus metrics: it requires installing and enabling Loki")
	}

	qb, err := loki.NewTopologyQuery(&cfg.Loki, in)
	if err != nil {
		return "", nil, http.StatusBadRequest, err
	}
	err = qb.Filters(filters)
	if err != nil {
		return "", nil, http.StatusBadRequest, err
	}
	return EncodeQuery(qb.Build()), nil, http.StatusOK, nil
}

func getEligiblePromMetric(promInventory *prometheus.Inventory, filters filters.SingleQuery, in *loki.TopologyInput) (string, []string) {
	if in.DataSource != constants.DataSourceAuto && in.DataSource != constants.DataSourceProm {
		return "", nil
	}
	if promInventory == nil {
		return "", nil
	}
	if in.RecordType != "" && in.RecordType != constants.RecordTypeLog {
		return "", nil
	}
	// TODO: packetLoss, how can we handle that?

	var labelsNeeded []string
	if in.Aggregate != "app" { // ignore app: it's a noop aggregation needed for Loki, not relevant in promQL
		labelsNeeded, _ = loki.GetLabelsAndFilter(in.Aggregate, in.Groups)
	}

	for _, m := range filters {
		if m.MoreThanOrEqual {
			// Not relevant/supported in promQL
			return "", nil
		}
		if m.Key == fields.FlowDirection {
			// TODO ??
			continue
		}
		if !slices.Contains(labelsNeeded, m.Key) {
			labelsNeeded = append(labelsNeeded, m.Key)
		}
	}

	// Check if that desired metric exists
	if m := promInventory.FindMetricName(labelsNeeded, in.DataField, "??"); m != "" {
		return m, nil
	}
	// Prometheus is enabled but no metric matched; check if potential disabled metrics could have matched
	return "", promInventory.FindDisabledCandidates(labelsNeeded, in.DataField, "??")
}
