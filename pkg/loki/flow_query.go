// Package loki provides functionalities for interacting with Loki
package loki

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
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
	config       *Config
	startTime    string
	endTime      string
	limit        string
	labelFilters []labelFilter
	lineFilters  []lineFilter
	jsonFilters  [][]labelFilter
}

func NewFlowQueryBuilder(cfg *Config, start, end, limit string, dedup bool,
	recordType constants.RecordType, packetLoss constants.PacketLoss) *FlowQueryBuilder {
	// Always use following stream selectors
	labelFilters := []labelFilter{
		// app, which will apply whichever matching criteria (any or all)
		stringEqualLabelFilter(constants.AppLabel, constants.AppLabelValue),
	}

	// only filter on _RecordType if available
	if cfg.IsLabel(recordTypeField) {
		if recordType == constants.RecordTypeAllConnections {
			// connection _RecordType including newConnection, heartbeat or endConnection
			labelFilters = append(labelFilters, stringMatchLalbeFilter(constants.RecordTypeLabel, strings.Join(constants.ConnectionTypes, "|")))
		} else if len(recordType) > 0 {
			// specific _RecordType either newConnection, heartbeat, endConnection or flowLog
			labelFilters = append(labelFilters, stringEqualLabelFilter(constants.RecordTypeLabel, string(recordType)))
		}
	}

	lineFilters := []lineFilter{}
	if dedup {
		if cfg.IsLabel(fields.Duplicate) {
			labelFilters = append(labelFilters, notStringLabelFilter(fields.Duplicate, "true"))
		} else {
			lineFilters = append(lineFilters, lineFilter{
				key:        fields.Duplicate,
				not:        true,
				allowEmpty: true,
				values: []lineMatch{{
					valueType: typeBool,
					value:     "true",
				}},
			})
		}
	}

	if packetLoss == constants.PacketLossDropped {
		// match records that doesn't contains "Packets" field and 1+ packets dropped
		// as FLP will ensure the filtering
		lineFilters = append(lineFilters,
			notContainsKeyLineFilter(fields.Packets),
			regexMatchLineFilter(fields.PktDropPackets, true, "[1-9][0-9]*"),
		)
	} else if packetLoss == constants.PacketLossHasDrop {
		// match 1+ packets dropped
		lineFilters = append(lineFilters,
			regexMatchLineFilter(fields.PktDropPackets, true, "[1-9][0-9]*"),
		)
	} else if packetLoss == constants.PacketLossSent {
		// match records that doesn't contains "PktDropPackets" field
		// as FLP will ensure the filtering
		lineFilters = append(lineFilters,
			notContainsKeyLineFilter(fields.PktDropPackets),
		)
	}

	return &FlowQueryBuilder{
		config:       cfg,
		startTime:    start,
		endTime:      end,
		limit:        limit,
		labelFilters: labelFilters,
		lineFilters:  lineFilters,
	}
}

func NewFlowQueryBuilderWithDefaults(cfg *Config) *FlowQueryBuilder {
	return NewFlowQueryBuilder(cfg, "", "", "", false, constants.RecordTypeLog, constants.PacketLossAll)
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
			} else if filter.MoreThanOrEqual {
				q.labelFilters = append(q.labelFilters, moreThanNumberLabelFilter(filter.Key, trimExactMatch(values[0])))
			} else {
				q.labelFilters = append(q.labelFilters, stringEqualLabelFilter(filter.Key, trimExactMatch(values[0])))
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
		q.addLineFilters(filter.Key, values, filter.Not, filter.MoreThanOrEqual)
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
			q.labelFilters = append(q.labelFilters, stringNotMatchLabelFilter(key, regexStr.String()))
		} else {
			q.labelFilters = append(q.labelFilters, stringMatchLalbeFilter(key, regexStr.String()))
		}
	}
}

func (q *FlowQueryBuilder) addLineFilters(key string, values []string, not bool, moreThan bool) {
	if len(values) == 0 {
		return
	}

	lf := lineFilter{
		key:      key,
		not:      not,
		moreThan: moreThan,
	}
	isArray := fields.IsArray(key)
	isNumeric := fields.IsNumeric(key)
	emptyMatches := false
	for _, value := range values {
		lm := lineMatch{}
		switch {
		case isArray:
			lm = lineMatch{valueType: typeRegexArrayContains, value: value}
		case isExactMatch(value):
			lm = lineMatch{valueType: typeString, value: trimExactMatch(value)}
			emptyMatches = emptyMatches || len(lm.value) == 0
		case isNumeric:
			lm = lineMatch{valueType: typeNumber, value: value}
		default:
			lm = lineMatch{valueType: typeRegexContains, value: value}
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
			filtersPerKey = append(filtersPerKey, stringEqualLabelFilter(key, ""))
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
}

func (q *FlowQueryBuilder) appendFilter(sb *strings.Builder, field string) {
	// ensure field is specified
	// |~`"{{field}}"`
	sb.WriteString("|~`\"")
	sb.WriteString(field)
	sb.WriteString("\"`")
}

func (q *FlowQueryBuilder) appendDNSFilter(sb *strings.Builder) {
	// ensure at least one Dns field is specified except DnsErrno
	// |~`"DnsId`|~`"DnsLatencyMs`|~`"DnsFlagsResponseCode"`
	sb.WriteString("|~`")
	sb.WriteString(`"DnsId`)
	sb.WriteString("`")
	sb.WriteString("|~`")
	sb.WriteString(`"DnsLatencyMs`)
	sb.WriteString("`")
	sb.WriteString("|~`")
	sb.WriteString(`"DnsFlagsResponseCode"`)
	sb.WriteString("`")
}

func (q *FlowQueryBuilder) appendDNSLatencyFilter(sb *strings.Builder) {
	// ensure DnsLatencyMs field is specified and value is not zero
	// |~`"DnsLatencyMs`!~`DnsLatencyMs%22:0[,}]`
	sb.WriteString("|~`")
	sb.WriteString(`"DnsLatencyMs`)
	sb.WriteString("`")
	sb.WriteString("!~`")
	sb.WriteString(`"DnsLatencyMs":0[,}]`)
	sb.WriteString("`")
}

func (q *FlowQueryBuilder) appendRTTFilter(sb *strings.Builder) {
	// ensure at TimeFlowRttNs field is specified
	// |~`"TimeFlowRttNs"`
	sb.WriteString("|~`")
	sb.WriteString(`"TimeFlowRttNs"`)
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
