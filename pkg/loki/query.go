// Package loki provides functionalities for interacting with Loki
package loki

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

const (
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
	queryRangePath  = "/loki/api/v1/query_range?query="
)

var qlog = logrus.WithField("component", "loki.query")

// can contains only alphanumeric / '-' / '_' / '.' / ',' / '"' / '*' / ':' / '/' characteres
var filterRegexpValidation = regexp.MustCompile(`^[\w-_.,\"*:/]*$`)

// remove quotes and replace * by regex any
var valueReplacer = strings.NewReplacer(`*`, `.*`, `"`, "")

type LabelJoiner string

const (
	joinAnd     = LabelJoiner("+and+")
	joinOr      = LabelJoiner("+or+")
	joinPipeAnd = LabelJoiner("|")
)

// Query for a LogQL HTTP petition
// The HTTP body of the query is composed by:
// {streamSelector}|lineFilters|json|labelFilters
type Query struct {
	// urlParams for the HTTP call
	baseURL             string
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

func NewQuery(baseURL string, labels []string, export bool) *Query {
	var exp *Export
	if export {
		exp = &Export{}
	}
	return &Query{
		baseURL:             baseURL,
		specialAttrs:        map[string]string{},
		labelJoiner:         joinPipeAnd,
		export:              exp,
		labelMap:            utils.GetMapInterface(labels),
		groupedLabelFilters: map[string][]labelFilter{},
	}
}

func (q *Query) AddParams(params map[string][]string) error {
	for key, values := range params {
		if len(values) == 0 {
			// Silently ignore
			continue
		}

		// Note: empty string allowed
		if err := q.AddParam(key, values[0]); err != nil {
			return err
		}
	}
	return nil
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
	case fields.DstAddr, fields.SrcAddr, fields.DstHostIP, fields.SrcHostIP:
		q.processIPFilters(key, strings.Split(value, ","))
	case fields.K8SObject, fields.SrcK8SObject, fields.DstK8SObject, fields.K8SOwnerObject, fields.SrcK8SOwnerObject, fields.DstK8SOwnerObject:
		return q.processK8SObjectFilter(key, strings.Split(value, ","))
	case fields.AddrPort, fields.SrcAddrPort, fields.DstAddrPort:
		q.processAddressPortFilter(key, strings.Split(value, ","))
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
		srcKey, dstKey := fields.ToSrcDst(key)
		if _, ok := q.labelMap[srcKey]; ok {
			if _, ok := q.labelMap[dstKey]; !ok {
				qlog.WithField("label", key).
					Warningf("can't run common label filter as Src field is defined as a label, but Dst is not. Ignoring it")
			} else {
				q.processCommonLabelFilter(key, strings.Split(value, ","))
			}
		} else {
			return q.processLineFilters(key, strings.Split(value, ","))
		}
	}
	return nil
}

func (q *Query) URLQuery() (string, error) {
	if len(q.streamSelector) == 0 {
		return "", errors.New("there is no stream selector. At least one label matcher is needed")
	}

	endpoint, mainPart, jsonPart, params := q.urlQueryParts()
	if len(jsonPart) > 0 {
		return endpoint + mainPart + "|json|" + jsonPart + params, nil
	}
	return endpoint + mainPart + params, nil
}

func (q *Query) urlQueryParts() (string, string, string, string) {
	endpointSb := strings.Builder{}
	querySb := strings.Builder{}
	jsonSb := strings.Builder{}
	paramSb := strings.Builder{}

	endpointSb.WriteString(strings.TrimRight(q.baseURL, "/"))
	endpointSb.WriteString(queryRangePath)
	querySb.WriteByte('{')
	for i, ss := range q.streamSelector {
		if i > 0 {
			querySb.WriteByte(',')
		}
		ss.writeInto(&querySb)
	}
	querySb.WriteByte('}')
	for _, lf := range q.lineFilters {
		querySb.WriteString("|~`")
		querySb.WriteString(lf)
		querySb.WriteByte('`')
	}
	if len(q.labelFilters) > 0 || len(q.groupedLabelFilters) > 0 {
		if q.labelJoiner == "" {
			panic("Label Joiner can't be empty")
		}
		q.WriteLabelFilter(&jsonSb, &q.labelFilters, q.labelJoiner)
		i := 0
		for _, glf := range q.groupedLabelFilters {
			if i > 0 {
				jsonSb.WriteString(string(q.labelJoiner))
			}
			//group with parenthesis
			jsonSb.WriteByte('(')
			//each group member must match
			q.WriteLabelFilter(&jsonSb, &glf, joinAnd)
			jsonSb.WriteByte(')')
			i++
		}
	}
	if len(q.urlParams) > 0 {
		for _, p := range q.urlParams {
			paramSb.WriteByte('&')
			paramSb.WriteString(p[0])
			paramSb.WriteByte('=')
			paramSb.WriteString(p[1])
		}
	}
	return endpointSb.String(), querySb.String(), jsonSb.String(), paramSb.String()
}

func (q *Query) WriteLabelFilter(sb *strings.Builder, lfs *[]labelFilter, lj LabelJoiner) {
	for i, lf := range *lfs {
		if i > 0 {
			sb.WriteString(string(lj))
		}
		lf.writeInto(sb)
	}
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
	srcKey, dstKey := fields.ToSrcDst(key)
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
			q.labelFilters = append(q.labelFilters, regexLabelFilter(srcKey, labelMatches, regexStr.String()))
			q.labelFilters = append(q.labelFilters, regexLabelFilter(dstKey, labelMatches, regexStr.String()))
		} else {
			q.groupedLabelFilters[*q.currentGroup] = append(q.groupedLabelFilters[*q.currentGroup], regexLabelFilter(srcKey, labelMatches, regexStr.String()))
			q.groupedLabelFilters[*q.currentGroup] = append(q.groupedLabelFilters[*q.currentGroup], regexLabelFilter(dstKey, labelMatches, regexStr.String()))
		}
	}
}

func getPrefix(field string) string {
	if strings.HasPrefix(field, fields.Src) {
		return fields.Src
	} else if strings.HasPrefix(field, fields.Dst) {
		return fields.Dst
	}
	return ""
}

func (q *Query) processK8SObjectFilter(key string, values []string) error {
	prefix := getPrefix((key))
	for _, value := range values {
		//expected value is Kind.Namespace.ObjectName
		if strings.Contains(value, ".") {
			splittedValue := strings.Split(value, ".")
			if strings.Contains(key, "Owner") {
				q.AddParamSrcDst(prefix, fields.OwnerType, splittedValue[0])
				q.AddParamSrcDst(prefix, fields.Namespace, splittedValue[1])
				q.AddParamSrcDst(prefix, fields.OwnerName, splittedValue[2])
			} else {
				q.AddParamSrcDst(prefix, fields.Type, splittedValue[0])
				q.AddParamSrcDst(prefix, fields.Namespace, splittedValue[1])
				q.AddParamSrcDst(prefix, fields.Name, splittedValue[2])
			}
		} else {
			return fmt.Errorf("invalid kubeObject filter: %s", value)
		}
	}
	return nil
}

func (q *Query) processAddressPortFilter(key string, values []string) {
	prefix := getPrefix((key))
	for _, value := range values {
		//can either be ipaddress / port / ipaddress:port
		if strings.Contains(value, ":") {
			ipAndPort := strings.Split(value, ":")
			q.AddParamSrcDst(prefix, fields.Addr, ipAndPort[0])
			q.AddParamSrcDst(prefix, fields.Port, ipAndPort[1])
		} else if strings.Contains(value, ".") {
			q.AddParamSrcDst(prefix, fields.Addr, value)
		} else if _, err := strconv.Atoi(value); err == nil {
			q.AddParamSrcDst(prefix, fields.Port, value)
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
		srcPrefix := fields.Src
		dstPrefix := fields.Dst
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
		fields.Port,
		fields.SrcPort,
		fields.DstPort,
		fields.Packets,
		fields.Proto,
		fields.Bytes:
		return true
	default:
		return false
	}
}
