// Package loki provides functionalities for interacting with Loki
package loki

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

const (
	startParam     = "start"
	endParam       = "end"
	limitParam     = "limit"
	queryRangePath = "/loki/api/v1/query_range?query="
	jsonOrJoiner   = "+or+"
	emptyMatch     = `""`
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

func NewFlowQueryBuilder(cfg *Config, start, end, limit, reporter string) *FlowQueryBuilder {
	// Always use app stream selector, which will apply whichever matching criteria (any or all)
	labelFilters := []labelFilter{
		stringLabelFilter(constants.AppLabel, constants.AppLabelValue),
	}
	if reporter == constants.ReporterSource {
		labelFilters = append(labelFilters, stringLabelFilter(fields.FlowDirection, "1"))
	} else if reporter == constants.ReporterDestination {
		labelFilters = append(labelFilters, stringLabelFilter(fields.FlowDirection, "0"))
	}
	return &FlowQueryBuilder{
		config:       cfg,
		startTime:    start,
		endTime:      end,
		limit:        limit,
		labelFilters: labelFilters,
	}
}

func NewFlowQueryBuilderWithDefaults(cfg *Config) *FlowQueryBuilder {
	return NewFlowQueryBuilder(cfg, "", "", "", constants.ReporterBoth)
}

func (q *FlowQueryBuilder) Filters(filters [][]string) error {
	for _, filter := range filters {
		if err := q.AddFilter(filter[0], filter[1]); err != nil {
			return err
		}
	}
	return nil
}

func (q *FlowQueryBuilder) AddFilter(key, joinedValues string) error {
	if !filterRegexpValidation.MatchString(joinedValues) {
		return fmt.Errorf("unauthorized sign in flows request: %s", joinedValues)
	}

	values := strings.Split(joinedValues, ",")

	// Stream selector labels
	if q.config.IsLabel(key) {
		if len(values) == 1 && isExactMatch(values[0]) {
			q.addExactMatchSingleLabel(key, trimExactMatch(values[0]))
		} else {
			q.addLabelRegex(key, values)
		}
	} else if fields.IsIP(key) {
		q.addIPFilters(key, values)
	} else {
		q.addLineFilters(key, values)
	}

	return nil
}

func (q *FlowQueryBuilder) addExactMatchSingleLabel(key string, value string) {
	q.labelFilters = append(q.labelFilters, stringLabelFilter(key, value))
}

func (q *FlowQueryBuilder) addLabelRegex(key string, values []string) {
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
		q.labelFilters = append(q.labelFilters, regexLabelFilter(key, regexStr.String()))
	}
}

func (q *FlowQueryBuilder) addLineFilters(key string, values []string) {
	if len(values) == 0 {
		return
	}
	lf := lineFilter{
		key: key,
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
		sb.WriteString("|~`")
		lf.writeInto(sb)
		sb.WriteByte('`')
	}
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
