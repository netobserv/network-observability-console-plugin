// Package loki provides functionalities for interacting with Loki
package loki

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

const (
	queryParam      = "query"
	startTimeKey    = "startTime"
	endTimeTimeKey  = "endTime"
	timeRangeKey    = "timeRange"
	limitKey        = "limit"
	exportFormatKey = "format"
	columnsKey      = "columns"
	startParam      = "start"
	endParam        = "end"
	limitParam      = "limit"
	matchParam      = "match"
	flowDirParam    = "FlowDirection"
	anyMatchValue   = "any"
)

// can contains only alphanumeric / '-' / '_' / '.' / ',' / '"' / '*' characteres
var filterRegexpValidation = regexp.MustCompile(`^[\w-_.,\"*]*$`)

// remove quotes and replace * by regex any
var valueReplacer = strings.NewReplacer(`*`, `.*`, `"`, "")

type LabelJoiner string

const (
	// joinOr spaces are escaped to avoid problems when querying Loki
	joinOr  = LabelJoiner("+or+")
	joinAnd = LabelJoiner("|")
)

// Query for a LogQL HTTP petition
// The HTTP body of the query is composed by:
// {streamSelector}|lineFilters|json|labelFilters
type Query struct {
	// urlParams for the HTTP call
	urlParams      [][2]string
	labelMap       map[string]struct{}
	streamSelector []labelFilter
	lineFilters    []string
	labelFilters   []labelFilter
	labelJoiner    LabelJoiner
	// Attributes with a special meaning that need to be processed independently
	specialAttrs map[string]string
	export       *Export
}

type Export struct {
	format  string
	columns []string
}

func NewQuery(labels []string, export bool) *Query {
	var exp *Export
	if export {
		exp = &Export{}
	}
	return &Query{
		specialAttrs: map[string]string{},
		labelJoiner:  joinAnd,
		export:       exp,
		labelMap:     utils.GetMapInterface(labels),
	}
}

func (q *Query) URLQuery() (string, error) {
	if len(q.streamSelector) == 0 {
		return "", errors.New("there is no stream selector. At least one label matcher is needed")
	}
	sb := strings.Builder{}
	sb.WriteString(queryParam + "={")
	for i, ss := range q.streamSelector {
		if i > 0 {
			sb.WriteByte(',')
		}
		ss.writeInto(&sb)
	}
	sb.WriteByte('}')
	for _, lf := range q.lineFilters {
		sb.WriteString("|~`")
		sb.WriteString(lf)
		sb.WriteByte('`')
	}
	if len(q.labelFilters) > 0 {
		if q.labelJoiner == "" {
			panic("Label Joiner can't be empty")
		}
		sb.WriteString("|json|")
		for i, lf := range q.labelFilters {
			if i > 0 {
				sb.WriteString(string(q.labelJoiner))
			}
			lf.writeInto(&sb)
		}
	}
	if len(q.urlParams) > 0 {
		for _, p := range q.urlParams {
			sb.WriteByte('&')
			sb.WriteString(p[0])
			sb.WriteByte('=')
			sb.WriteString(p[1])
		}
	}
	return sb.String(), nil
}

func (q *Query) AddParam(key, value string) error {
	if !filterRegexpValidation.MatchString(value) {
		return fmt.Errorf("unauthorized sign in flows request: %s", value)
	}
	switch key {
	case exportFormatKey:
		if q.export != nil {
			q.export.format = value
		} else {
			return fmt.Errorf("export format is not allowed for this endpoint")
		}
	case columnsKey:
		if q.export != nil {
			values := strings.Split(value, ",")
			q.export.columns = values
		} else {
			return fmt.Errorf("export columns are not allowed for this endpoint")
		}
	case startTimeKey:
		q.addURLParam(startParam, value)
	case endTimeTimeKey:
		q.addURLParam(endParam, value)
	case timeRangeKey:
		r, err := strconv.ParseInt(value, 10, 64)
		if err != nil {
			return err
		}
		q.addURLParam(startParam, strconv.FormatInt(time.Now().Unix()-r, 10))
	case limitKey:
		q.addURLParam(limitParam, value)
	// Attributes that have a special meaning and need to be treated apart
	case matchParam, flowDirParam:
		q.specialAttrs[key] = value
	// IP filter labels
	case "DstAddr", "SrcAddr", "DstHostIP", "SrcHostIP":
		q.processIPFilters(key, strings.Split(value, ","))
	default:
		// Stream selector labels
		if _, ok := q.labelMap[key]; ok {
			q.processStreamSelector(key, strings.Split(value, ","))
		} else {
			return q.processLineFilters(key, strings.Split(value, ","))
		}
	}
	return nil
}

// PrepareToSubmit returns a new Query that already handles the special behavior of some attributes
// that mustn't be used as part of a generic query.
func (q *Query) PrepareToSubmit() (*Query, error) {
	var out *Query
	// If match=any, it converts the query to a query that matches when only of the given
	// attributes match
	if match := q.specialAttrs[matchParam]; match == anyMatchValue {
		out = q.convertToAnyMatch()
	} else {
		// copy receiver query
		cp := *q
		out = &cp
	}

	// Append app stream selector, which will apply whichever matching criteria (any or all)
	out.streamSelector = append(out.streamSelector,
		stringLabelFilter("app", labelEqual, "netobserv-flowcollector"))

	// Filter by flow direction independently of the matching criteria (any or all)
	if flowDir, ok := out.specialAttrs[flowDirParam]; ok {
		out.streamSelector = append(out.streamSelector,
			stringLabelFilter(flowDirParam, labelEqual, flowDir))
	}
	return out, nil
}

func (q *Query) addURLParam(key, val string) {
	q.urlParams = append(q.urlParams, [2]string{key, val})
}

func (q *Query) processStreamSelector(key string, values []string) {
	regexStr := strings.Builder{}
	for i, value := range values {
		if i > 0 {
			regexStr.WriteByte('|')
		}
		//match any caracter before / after value : .*VALUE.* if not quoted
		writeRegexValue(&regexStr, value)
	}

	if regexStr.Len() > 0 {
		q.streamSelector = append(q.streamSelector,
			stringLabelFilter(key, labelMatches, regexStr.String()))
	}
}

// filterIPInLine assumes that we are searching for that IP addresses as part
// of the log line (not in the stream selector labels)
func (q *Query) processIPFilters(key string, values []string) {
	for _, value := range values {
		q.labelFilters = append(q.labelFilters, ipLabelFilter(key, value))
	}
}

func (q *Query) ExportFormat() string {
	if q.export == nil {
		return ""
	}
	return q.export.format
}

func (q *Query) ExportColumns() []string {
	if q.export == nil {
		return nil
	}
	return q.export.columns
}

func (q *Query) processLineFilters(key string, values []string) error {
	regexStr := strings.Builder{}
	for i, value := range values {
		if i > 0 {
			regexStr.WriteByte('|')
		}
		//match KEY + VALUE: "KEY":"[^\"]*VALUE" (ie: contains VALUE) or, if numeric, "KEY":VALUE
		regexStr.WriteString(`"`)
		regexStr.WriteString(key)
		regexStr.WriteString(`":`)
		if isNumeric(key) {
			regexStr.WriteString(value)
		} else {
			regexStr.WriteString(`"`)
			writeRegexValue(&regexStr, value)
			regexStr.WriteString(`"`)
		}
	}

	if regexStr.Len() > 0 {
		q.lineFilters = append(q.lineFilters, regexStr.String())
	}
	return nil
}

func isNumeric(v string) bool {
	switch v {
	case
		"SrcPort",
		"DstPort",
		"Packets",
		"Proto",
		"Bytes":
		return true
	default:
		return false
	}
}

func writeRegexValue(regexStr *strings.Builder, value string) {
	if !strings.HasPrefix(value, `"`) {
		regexStr.WriteString(".*")
	}
	regexStr.WriteString(valueReplacer.Replace(value))
	if !strings.HasSuffix(value, `"`) {
		regexStr.WriteString(".*")
	}
}
