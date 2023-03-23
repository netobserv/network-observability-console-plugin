package handler

import (
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

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

func getMetricType(params url.Values) (constants.MetricType, error) {
	mt := params.Get(metricTypeKey)
	if mt == "" {
		return constants.DefaultMetricType, nil
	}
	metricType := constants.MetricType(mt)
	if metricType == constants.MetricTypeBytes ||
		metricType == constants.MetricTypeCount ||
		metricType == constants.MetricTypeDroppedBytes ||
		metricType == constants.MetricTypeDroppedPackets ||
		metricType == constants.MetricTypePackets {
		return metricType, nil
	}
	return "", fmt.Errorf("invalid metric type: %s", mt)
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

func getStep(params url.Values) (string, error) {
	step := params.Get(stepKey)
	if step == "" {
		return defaultStep, nil
	}
	if _, err := time.ParseDuration(step); err != nil {
		return "", fmt.Errorf("invalid step %s: %w", step, err)
	}
	return step, nil
}
