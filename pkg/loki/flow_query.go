// Package loki provides functionalities for interacting with Loki
package loki

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

const (
	recordTypeField = "_RecordType"
	startParam      = "start"
	endParam        = "end"
	limitParam      = "limit"
	queryRangePath  = "/loki/api/v1/query_range?query="
	jsonOrJoiner    = "+or+"
	emptyMatch      = `""`
)

// can contains only alphanumeric / '-' / '_' / '.' / ',' / '"' / '*' / ':' / '/' characteres
var filterRegexpValidation = regexp.MustCompile(`^[\w-_.,\"*:/]*$`)

// FlowQueryBuilder stores a state to build a LogQL query
type FlowQueryBuilder struct {
	config           *Config
	startTime        string
	endTime          string
	limit            string
	labelFilters     []labelFilter
	lineFilters      []lineFilter
	extraLineFilters []string
	jsonFilters      [][]labelFilter
}

func NewFlowQueryBuilder(cfg *Config, start, end, limit string, reporter constants.Reporter,
	recordType constants.RecordType, packetLoss constants.PacketLoss) *FlowQueryBuilder {
	// Always use following stream selectors
	labelFilters := []labelFilter{
		// app, which will apply whichever matching criteria (any or all)
		stringLabelFilter(constants.AppLabel, constants.AppLabelValue),
	}

	// only filter on _RecordType if available
	if cfg.IsLabel(recordTypeField) {
		if recordType == constants.RecordTypeAllConnections {
			// connection _RecordType including newConnection, heartbeat or endConnection
			labelFilters = append(labelFilters, regexLabelFilter(constants.RecordTypeLabel, strings.Join(constants.ConnectionTypes, "|")))
		} else if len(recordType) > 0 {
			// specific _RecordType either newConnection, heartbeat, endConnection or flowLog
			labelFilters = append(labelFilters, stringLabelFilter(constants.RecordTypeLabel, string(recordType)))
		}
	}

	if !utils.Contains(constants.ConnectionTypes, string(recordType)) {
		if reporter == constants.ReporterSource {
			labelFilters = append(labelFilters, stringLabelFilter(fields.FlowDirection, "1"))
		} else if reporter == constants.ReporterDestination {
			labelFilters = append(labelFilters, stringLabelFilter(fields.FlowDirection, "0"))
		}
	}

	extraLineFilters := []string{}
	if packetLoss != constants.PacketLossAll {
		sb := strings.Builder{}
		if packetLoss == constants.PacketLossDropped {
			// match 0 packet sent and 1+ packets dropped
			sb.WriteString("|~`")
			sb.WriteString(`Packets":0[,}]`)
			sb.WriteString("`")
			sb.WriteString("|~`")
			sb.WriteString(`TcpDropPackets":[1-9]*[,}]`)
			sb.WriteString("`")
		} else if packetLoss == constants.PacketLossHasDrop {
			// match 1+ packets dropped
			sb.WriteString("|~`")
			sb.WriteString(`TcpDropPackets":[1-9]*[,}]`)
			sb.WriteString("`")
		} else if packetLoss == constants.PacketLossSent {
			// match 1+ packets sent
			sb.WriteString("|~`")
			sb.WriteString(`Packets":[1-9]*[,}]`)
			sb.WriteString("`")
		}
		extraLineFilters = append(extraLineFilters, sb.String())
	}

	return &FlowQueryBuilder{
		config:           cfg,
		startTime:        start,
		endTime:          end,
		limit:            limit,
		labelFilters:     labelFilters,
		extraLineFilters: extraLineFilters,
	}
}

func NewFlowQueryBuilderWithDefaults(cfg *Config) *FlowQueryBuilder {
	return NewFlowQueryBuilder(cfg, "", "", "", constants.ReporterBoth, constants.RecordTypeLog, constants.PacketLossAll)
}

func (q *FlowQueryBuilder) Filters(queryFilters filters.SingleQuery) error {
	for _, filter := range queryFilters {
		if err := q.addFilter(filter); err != nil {
			return err
		}
	}
	return nil
}

func (q *FlowQueryBuilder) addFilter(filter filters.Match) error {
	if !filterRegexpValidation.MatchString(filter.Values) {
		return fmt.Errorf("unauthorized sign in flows request: %s", filter.Values)
	}

	values := strings.Split(filter.Values, ",")

	// Stream selector labels
	if q.config.IsLabel(filter.Key) {
		if len(values) == 1 && isExactMatch(values[0]) {
			if filter.Not {
				q.labelFilters = append(q.labelFilters, notStringLabelFilter(filter.Key, trimExactMatch(values[0])))
			} else {
				q.labelFilters = append(q.labelFilters, stringLabelFilter(filter.Key, trimExactMatch(values[0])))
			}
		} else {
			q.addLabelRegex(filter.Key, values, filter.Not)
		}
	} else if fields.IsIP(filter.Key) {
		if filter.Not {
			return fmt.Errorf("'not' operation not allowed in IP filters")
		}
		q.addIPFilters(filter.Key, values)
	} else {
		q.addLineFilters(filter.Key, values, filter.Not)
	}

	return nil
}

func (q *FlowQueryBuilder) addLabelRegex(key string, values []string, not bool) {
	regexStr := strings.Builder{}
	for i, value := range values {
		if i > 0 {
			regexStr.WriteByte('|')
		}
		//match the beginning of string if quoted without a star
		//and case insensitive if no quotes
		if !strings.HasPrefix(value, `"`) {
			regexStr.WriteString("(?i).*")
		} else if !strings.HasPrefix(value, `"*`) {
			regexStr.WriteString("^")
		}
		//inject value with regex
		regexStr.WriteString(valueReplacer.Replace(value))
		//match the end  of string if quoted without a star
		if !strings.HasSuffix(value, `"`) {
			regexStr.WriteString(".*")
		} else if !strings.HasSuffix(value, `*"`) {
			regexStr.WriteString("$")
		}
	}

	if regexStr.Len() > 0 {
		if not {
			q.labelFilters = append(q.labelFilters, notRegexLabelFilter(key, regexStr.String()))
		} else {
			q.labelFilters = append(q.labelFilters, regexLabelFilter(key, regexStr.String()))
		}
	}
}

func (q *FlowQueryBuilder) addLineFilters(key string, values []string, not bool) {
	if len(values) == 0 {
		return
	}
	lf := lineFilter{
		key: key,
		not: not,
	}
	isNumeric := fields.IsNumeric(key)
	emptyMatches := false
	for _, value := range values {
		lm := lineMatch{}
		switch {
		case isExactMatch(value):
			lm = lineMatch{valueType: typeString, value: trimExactMatch(value)}
			emptyMatches = emptyMatches || len(lm.value) == 0
		case isNumeric:
			lm = lineMatch{valueType: typeNumber, value: value}
		default:
			lm = lineMatch{valueType: typeRegex, value: value}
		}
		lf.values = append(lf.values, lm)
	}
	// if there is at least an empty exact match, there is no uniform/safe way to filter by text,
	// so we should use JSON label matchers instead of text line matchers
	if emptyMatches {
		q.jsonFilters = append(q.jsonFilters, lf.asLabelFilters())
	} else {
		q.lineFilters = append(q.lineFilters, lf)
	}
}

// addIPFilters assumes that we are searching for that IP addresses as part
// of the log line (not in the stream selector labels)
func (q *FlowQueryBuilder) addIPFilters(key string, values []string) {
	filtersPerKey := make([]labelFilter, 0, len(values))
	for _, value := range values {
		// empty exact matches should be treated as attribute filters looking for empty IP
		if value == emptyMatch {
			filtersPerKey = append(filtersPerKey, stringLabelFilter(key, ""))
		} else {
			filtersPerKey = append(filtersPerKey, ipLabelFilter(key, value))
		}
	}
	q.jsonFilters = append(q.jsonFilters, filtersPerKey)
}

func (q *FlowQueryBuilder) createStringBuilderURL() *strings.Builder {
	sb := strings.Builder{}
	sb.WriteString(strings.TrimRight(q.config.URL.String(), "/"))
	sb.WriteString(queryRangePath)
	return &sb
}

func (q *FlowQueryBuilder) appendLabels(sb *strings.Builder) {
	sb.WriteString("{")
	for i, ss := range q.labelFilters {
		if i > 0 {
			sb.WriteByte(',')
		}
		ss.writeInto(sb)
	}
	sb.WriteByte('}')
}

func (q *FlowQueryBuilder) appendLineFilters(sb *strings.Builder) {
	for _, lf := range q.lineFilters {
		lf.writeInto(sb)
	}

	for _, glf := range q.extraLineFilters {
		sb.WriteString(glf)
	}
}

func (q *FlowQueryBuilder) appendDeduplicateFilter(sb *strings.Builder) {
	// |~`Duplicate":false`
	sb.WriteString("|~`")
	sb.WriteString(`Duplicate":false`)
	sb.WriteString("`")
}

func (q *FlowQueryBuilder) appendTCPDropStateFilter(sb *strings.Builder) {
	// !~`TcpDropState":0`
	sb.WriteString("!~`")
	sb.WriteString(`TcpDropState":0`)
	sb.WriteString("`")
}

func (q *FlowQueryBuilder) appendTCPDropCauseFilter(sb *strings.Builder) {
	// !~`TcpDropCause":0`
	sb.WriteString("!~`")
	sb.WriteString(`TcpDropCause":0`)
	sb.WriteString("`")
}

func (q *FlowQueryBuilder) appendJSON(sb *strings.Builder, forceAppend bool) {
	if forceAppend || len(q.jsonFilters) > 0 {
		sb.WriteString("|json")
		for _, lfPerKey := range q.jsonFilters {
			sb.WriteByte('|')
			for i, lf := range lfPerKey {
				if i > 0 {
					sb.WriteString(jsonOrJoiner)
				}
				lf.writeInto(sb)
			}
		}
	}
}

func (q *FlowQueryBuilder) appendQueryParams(sb *strings.Builder) {
	if len(q.startTime) > 0 {
		appendQueryParam(sb, startParam, q.startTime)
	}
	if len(q.endTime) > 0 {
		appendQueryParam(sb, endParam, q.endTime)
	}
	if len(q.limit) > 0 {
		appendQueryParam(sb, limitParam, q.limit)
	}
}

func (q *FlowQueryBuilder) Build() string {
	sb := q.createStringBuilderURL()
	q.appendLabels(sb)
	q.appendLineFilters(sb)
	q.appendJSON(sb, false)
	q.appendQueryParams(sb)
	return sb.String()
}

func appendQueryParam(sb *strings.Builder, key, value string) {
	sb.WriteByte('&')
	sb.WriteString(key)
	sb.WriteByte('=')
	sb.WriteString(value)
}

func isExactMatch(value string) bool {
	return strings.HasPrefix(value, `"`) && strings.HasSuffix(value, `"`)
}

func trimExactMatch(value string) string {
	return strings.TrimPrefix(strings.TrimSuffix(value, `"`), `"`)
}
