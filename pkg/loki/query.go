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
	"github.com/sirupsen/logrus"
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

var qlog = logrus.WithField("component", "loki.query")

// can contains only alphanumeric / '-' / '_' / '.' / ',' / '"' / '*' characteres
var filterRegexpValidation = regexp.MustCompile(`^[\w-_.,\"*:]*$`)

// remove quotes and replace * by regex any
var valueReplacer = strings.NewReplacer(`*`, `.*`, `"`, "")

type LabelJoiner string

const (
	// joinOr spaces are escaped to avoid problems when querying Loki
	joinOr      = LabelJoiner("+or+")
	joinPipeAnd = LabelJoiner("|")
)

// Query for a LogQL HTTP petition
// The HTTP body of the query is composed by:
// {streamSelector}|lineFilters|json|labelFilters
type Query struct {
	// urlParams for the HTTP call
	urlParams           [][2]string
	labelMap            map[string]struct{}
	streamSelector      []labelFilter
	lineFilters         []string
	labelFilters        []labelFilter
	currentGroup        *string
	groupedLabelFilters map[string][]labelFilter
	labelJoiner         LabelJoiner
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
		specialAttrs:        map[string]string{},
		labelJoiner:         joinPipeAnd,
		export:              exp,
		labelMap:            utils.GetMapInterface(labels),
		groupedLabelFilters: map[string][]labelFilter{},
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
	if len(q.labelFilters) > 0 || len(q.groupedLabelFilters) > 0 {
		if q.labelJoiner == "" {
			panic("Label Joiner can't be empty")
		}
		sb.WriteString("|json|")
		q.WriteLabelFilter(&sb, &q.labelFilters, q.labelJoiner)
		i := 0
		for _, glf := range q.groupedLabelFilters {
			if i > 0 {
				sb.WriteString(string(q.labelJoiner))
			}
			//group with parenthesis
			sb.WriteByte('(')
			q.WriteLabelFilter(&sb, &glf, joinOr)
			sb.WriteByte(')')
			i++
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

func (q *Query) WriteLabelFilter(sb *strings.Builder, lfs *[]labelFilter, lj LabelJoiner) {
	for i, lf := range *lfs {
		if i > 0 {
			sb.WriteString(string(lj))
		}
		lf.writeInto(sb)
	}
}

func (q *Query) AddParam(key, value string) error {
	if !filterRegexpValidation.MatchString(value) {
		return fmt.Errorf("unauthorized sign in flows request: %s", value)
	}
	switch key {
	case exportFormatKey:
		return q.addParamFormat(value)
	case columnsKey:
		return q.addParamColumns(value)
	case startTimeKey:
		q.addURLParam(startParam, value)
	case endTimeTimeKey:
		q.addURLParam(endParam, value)
	case timeRangeKey:
		return q.addParamTime(value)
	case limitKey:
		q.addURLParam(limitParam, value)
	// Attributes that have a special meaning and need to be treated apart
	case matchParam, flowDirParam:
		q.specialAttrs[key] = value
	// IP filter labels
	case "DstAddr", "SrcAddr", "DstHostIP", "SrcHostIP":
		q.processIPFilters(key, strings.Split(value, ","))
	case "Workload", "Namespace":
		q.processCommonLabelFilter(key, strings.Split(value, ","))
	case "FQDN", "SrcFQDN", "DstFQDN":
		q.processFQDNFilter(key, strings.Split(value, ","))
	default:
		return q.addParamDefault(key, value)
	}
	return nil
}

func (q *Query) addParamFormat(value string) error {
	if q.export != nil {
		q.export.format = value
	} else {
		return fmt.Errorf("export format is not allowed for this endpoint")
	}
	return nil
}

func (q *Query) addParamColumns(value string) error {
	if q.export != nil {
		values := strings.Split(value, ",")
		q.export.columns = values
	} else {
		return fmt.Errorf("export columns are not allowed for this endpoint")
	}
	return nil
}

func (q *Query) addParamTime(value string) error {
	r, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return err
	}
	q.addURLParam(startParam, strconv.FormatInt(time.Now().Unix()-r, 10))
	return nil
}

func (q *Query) addParamDefault(key, value string) error {
	// Stream selector labels
	if _, ok := q.labelMap[key]; ok {
		q.processStreamSelector(key, strings.Split(value, ","))
	} else {
		return q.processLineFilters(key, strings.Split(value, ","))
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
		//match the begining of string if quoted without a star
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
		if q.currentGroup == nil {
			q.streamSelector = append(q.streamSelector,
				stringLabelFilter(key, labelMatches, regexStr.String()))
		} else {
			q.groupedLabelFilters[*q.currentGroup] = append(q.groupedLabelFilters[*q.currentGroup],
				stringLabelFilter(key, labelMatches, regexStr.String()))
		}
	}
}

// filterIPInLine assumes that we are searching for that IP addresses as part
// of the log line (not in the stream selector labels)
func (q *Query) processIPFilters(key string, values []string) {
	for _, value := range values {
		if q.currentGroup == nil {
			q.labelFilters = append(q.labelFilters, ipLabelFilter(key, value))
		} else {
			q.groupedLabelFilters[*q.currentGroup] = append(q.groupedLabelFilters[*q.currentGroup],
				ipLabelFilter(key, value))
		}
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
		//match end of KEY + regex VALUE:
		//if numeric, KEY":VALUE
		//if string KEY":"VALUE"
		//ie 'Port' key will match both 'SrcPort":"XXX"' and 'DstPort":"XXX"
		//VALUE can be quoted for exact match or contains * to inject regex any
		regexStr.WriteString(key)
		regexStr.WriteString(`":`)
		if isNumeric(key) {
			regexStr.WriteString(value)
		} else {
			regexStr.WriteString(`"`)
			// match start any if not quoted
			// and case insensitive
			if !strings.HasPrefix(value, `"`) {
				regexStr.WriteString("(?i).*")
			}
			//inject value with regex
			regexStr.WriteString(valueReplacer.Replace(value))
			// match end any if not quoted
			if !strings.HasSuffix(value, `"`) {
				regexStr.WriteString(".*")
			}
			regexStr.WriteString(`"`)
		}
	}

	if regexStr.Len() > 0 {
		if q.currentGroup == nil {
			q.lineFilters = append(q.lineFilters, regexStr.String())
		} else {
			lf, ok := lineToLabelFilter(regexStr.String())
			if ok {
				q.groupedLabelFilters[*q.currentGroup] = append(q.groupedLabelFilters[*q.currentGroup], lf)
			} else {
				qlog.WithField("lineFilter", lf).
					Warningf("line filter can't be parsed as json attribute. Ignoring it")
			}
		}
	}
	return nil
}

func (q *Query) processCommonLabelFilter(key string, values []string) {
	for _, value := range values {
		regexStr := strings.Builder{}
		// match start any if not quoted
		if !strings.HasPrefix(value, `"`) {
			regexStr.WriteString(".*")
		}
		//inject value with regex
		regexStr.WriteString(valueReplacer.Replace(value))
		// match end any if not quoted
		if !strings.HasSuffix(value, `"`) {
			regexStr.WriteString(".*")
		}
		// apply filter on both Src and Dst fields
		if q.currentGroup == nil {
			q.labelFilters = append(q.labelFilters, regexLabelFilter("Src"+key, labelMatches, regexStr.String()))
			q.labelFilters = append(q.labelFilters, regexLabelFilter("Dst"+key, labelMatches, regexStr.String()))
		} else {
			q.groupedLabelFilters[*q.currentGroup] = append(q.groupedLabelFilters[*q.currentGroup], regexLabelFilter("Src"+key, labelMatches, regexStr.String()))
			q.groupedLabelFilters[*q.currentGroup] = append(q.groupedLabelFilters[*q.currentGroup], regexLabelFilter("Dst"+key, labelMatches, regexStr.String()))
		}
	}
}

func (q *Query) processFQDNFilter(key string, values []string) {
	prefix := ""
	if strings.HasPrefix(key, "Src") {
		prefix = "Src"
	} else if strings.HasPrefix(key, "Dst") {
		prefix = "Dst"
	}

	for _, value := range values {
		//FQDN can either be namespace / pod / namespace.pod / ipaddress / port / ipaddress:port
		if strings.Contains(value, ":") {
			ipAndPort := strings.Split(value, ":")
			q.AddParamSrcDst(prefix, "Addr", ipAndPort[0])
			q.AddParamSrcDst(prefix, "Port", ipAndPort[1])
		} else if strings.Contains(value, ".") {
			splittedValue := strings.Split(value, ".")
			if len(splittedValue) == 2 {
				q.AddParamSrcDst(prefix, "Namespace", splittedValue[0])
				q.AddParamSrcDst(prefix, "Pod", splittedValue[1])
			} else {
				q.AddParamSrcDst(prefix, "Addr", value)
			}
		} else if _, err := strconv.Atoi(value); err == nil {
			q.AddParamSrcDst(prefix, "Port", value)
		} else {
			q.AddParamSrcDst(prefix, "Namespace", value)
			q.AddParamSrcDst(prefix, "Pod", value)
		}
	}
}

func (q *Query) AddParamSrcDst(prefix, key, value string) {
	if len(prefix) > 0 {
		q.currentGroup = &prefix
		err := q.AddParam(prefix+key, value)
		if err != nil {
			qlog.Error(err)
		}
		q.currentGroup = nil
	} else {
		srcPrefix := "Src"
		dstPrefix := "Dst"
		q.currentGroup = &srcPrefix
		err := q.AddParam(srcPrefix+key, value)
		if err != nil {
			qlog.Error(err)
		}
		q.currentGroup = &dstPrefix
		err = q.AddParam(dstPrefix+key, value)
		if err != nil {
			qlog.Error(err)
		}
		q.currentGroup = nil
	}

}

func isNumeric(v string) bool {
	switch v {
	case
		"Port",
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
