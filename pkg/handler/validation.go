package handler

import (
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

func getStartTime(params url.Values) (string, time.Time, error) {
	start := params.Get(startTimeKey)
	var sTime time.Time
	if len(start) == 0 {
		tr := params.Get(timeRangeKey)
		if len(tr) > 0 {
			r, err := strconv.ParseInt(tr, 10, 64)
			if err != nil {
				return "", sTime, errors.New("Could not parse time range: " + err.Error())
			}
			sTime = time.Now().Add(-time.Second * time.Duration(r))
			start = strconv.FormatInt(sTime.Unix(), 10)
		}
	} else {
		// Make sure it is a valid int
		s, err := strconv.ParseInt(start, 10, 64)
		if err != nil {
			return "", sTime, errors.New("Could not parse start time: " + err.Error())
		}
		sTime = time.Unix(s, 0)
	}
	return start, sTime, nil
}

// getEndTime will parse end time and ceil it to the next second
func getEndTime(params url.Values) (string, time.Time, error) {
	end := params.Get(endTimeKey)
	eTime := time.Now()
	if len(end) > 0 {
		r, err := strconv.ParseInt(end, 10, 64)
		if err != nil {
			return "", eTime, errors.New("Could not parse end time: " + err.Error())
		}
		eTime = time.Unix(r+1, 0)
		end = strconv.Itoa(int(r) + 1)
	}
	return end, eTime, nil
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

func getRecordType(params url.Values) (constants.RecordType, error) {
	rt := params.Get(recordTypeKey)
	if rt == "" {
		return constants.DefaultRecordType, nil
	}
	recordType := constants.RecordType(rt)
	if recordType == constants.RecordTypeAllConnections ||
		recordType == constants.RecordTypeEndConnection ||
		recordType == constants.RecordTypeHeartbeat ||
		recordType == constants.RecordTypeLog ||
		recordType == constants.RecordTypeNewConnection {
		return recordType, nil
	}
	return "", fmt.Errorf("invalid record type: %s", rt)
}

func getPacketLoss(params url.Values) (constants.PacketLoss, error) {
	pl := params.Get(packetLossKey)
	if pl == "" {
		return constants.DefaultPacketLoss, nil
	}
	packetLoss := constants.PacketLoss(pl)
	if packetLoss == constants.PacketLossAll ||
		packetLoss == constants.PacketLossDropped ||
		packetLoss == constants.PacketLossHasDrop ||
		packetLoss == constants.PacketLossSent {
		return packetLoss, nil
	}
	return "", fmt.Errorf("invalid packet loss: %s", pl)
}

func getAggregate(params url.Values) (string, error) {
	agg := params.Get(aggregateByKey)
	if agg == "" {
		return "", errors.New("aggregateBy parameter is required")
	}
	return agg, nil
}

func getMetricType(params url.Values) string {
	mt := params.Get(metricTypeKey)
	if mt == "" {
		return constants.DefaultMetricType
	}
	return mt
}

func getMetricFunction(params url.Values) (constants.MetricFunction, error) {
	mf := params.Get(metricFunctionKey)
	if mf == "" {
		return constants.DefaultMetricFunction, nil
	}
	metricFunction := constants.MetricFunction(mf)
	if metricFunction == constants.MetricFunctionCount ||
		metricFunction == constants.MetricFunctionSum ||
		metricFunction == constants.MetricFunctionAvg ||
		metricFunction == constants.MetricFunctionMin ||
		metricFunction == constants.MetricFunctionMax ||
		metricFunction == constants.MetricFunctionP90 ||
		metricFunction == constants.MetricFunctionP99 ||
		metricFunction == constants.MetricFunctionRate {
		return metricFunction, nil
	}
	return "", fmt.Errorf("invalid metric function: %s", mf)
}

func getRateInterval(params url.Values) (string, error) {
	rateInterval := params.Get(rateIntervalKey)
	if rateInterval == "" {
		return defaultRateInterval, nil
	}
	if _, err := time.ParseDuration(rateInterval); err != nil {
		return "", fmt.Errorf("invalid rate interval %s: %w", rateInterval, err)
	}
	return rateInterval, nil
}

func getStep(params url.Values) (string, time.Duration, error) {
	step := params.Get(stepKey)
	if step == "" {
		return defaultStep, defaultStepDuration, nil
	}
	d, err := time.ParseDuration(step)
	if err != nil {
		return "", 0, fmt.Errorf("invalid step %s: %w", step, err)
	}
	return step, d, nil
}
