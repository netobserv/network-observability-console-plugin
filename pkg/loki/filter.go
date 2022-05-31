package loki

import (
	"fmt"
	"strings"
)

// remove quotes and replace * by regex any
var valueReplacer = strings.NewReplacer(`*`, `.*`, `"`, "")

type labelMatcher string

const (
	labelEqual   = labelMatcher("=")
	labelMatches = labelMatcher("=~")
)

type valueType int

const (
	typeNumber valueType = iota
	typeString
	typeRegex
	typeIP
)

// labelFilter represents a condition based on a label name, value and matching operator. It
// applies to LogQL stream selectors and attribute filtering
type labelFilter struct {
	key       string
	matcher   labelMatcher
	value     string
	valueType valueType
}

type lineMatch struct {
	value     string
	valueType valueType
}

type lineFilter struct {
	key    string
	values []lineMatch
}

func stringLabelFilter(labelKey string, value string) labelFilter {
	return labelFilter{
		key:       labelKey,
		matcher:   labelEqual,
		value:     value,
		valueType: typeString,
	}
}

func regexLabelFilter(labelKey string, value string) labelFilter {
	return labelFilter{
		key:       labelKey,
		matcher:   labelMatches,
		value:     value,
		valueType: typeString,
	}
}

func ipLabelFilter(labelKey, cidr string) labelFilter {
	return labelFilter{
		key:       labelKey,
		matcher:   labelEqual,
		value:     cidr,
		valueType: typeIP,
	}
}

func (f *labelFilter) writeInto(sb *strings.Builder) {
	sb.WriteString(f.key)
	sb.WriteString(string(f.matcher))
	switch f.valueType {
	case typeNumber:
		sb.WriteString(f.value)
	case typeString:
		sb.WriteByte('"')
		sb.WriteString(f.value)
		sb.WriteByte('"')
	case typeIP:
		sb.WriteString(`ip("`)
		sb.WriteString(f.value)
		sb.WriteString(`")`)
	case typeRegex:
		sb.WriteByte('`')
		sb.WriteString(f.value)
		sb.WriteByte('`')
	default:
		panic(fmt.Sprint("wrong filter value type", int(f.valueType)))
	}
}

func (f *lineFilter) asLabelFilters() []labelFilter {
	lfs := make([]labelFilter, 0, len(f.values))
	for _, value := range f.values {
		lf := labelFilter{
			key:       f.key,
			valueType: value.valueType,
			value:     value.value,
		}
		if value.valueType == typeRegex {
			lf.matcher = labelMatches
		} else {
			lf.matcher = labelEqual
		}
		lfs = append(lfs, lf)
	}
	return lfs
}

func (f *lineFilter) writeInto(sb *strings.Builder) {
	for i, v := range f.values {
		if i > 0 {
			sb.WriteByte('|')
		}
		// match end of KEY + regex VALUE:
		// if numeric, KEY":VALUE,
		// if string KEY":"VALUE"
		// ie 'Port' key will match both 'SrcPort":"XXX"' and 'DstPort":"XXX"
		// VALUE can be quoted for exact match or contains * to inject regex any
		// For numeric values, exact match is implicit
		// 	(the trick is to match for the ending coma; it works as long as the filtered field
		// 	is not the last one (they're in alphabetic order); a less performant alternative
		// 	but more future-proof/less hacky could be to move that to a json filter, if needed)
		sb.WriteString(f.key)
		sb.WriteString(`":`)
		switch v.valueType {
		case typeNumber:
			sb.WriteString(v.value)
			// a number can be followed by } if it's the last property of a JSON document
			sb.WriteString("[,}]")
		case typeString:
			// exact matches are specified as just strings
			sb.WriteByte('"')
			sb.WriteString(valueReplacer.Replace(v.value))
			sb.WriteByte('"')
		// contains-match are specified as regular expressions
		case typeRegex:
			sb.WriteString(`"(?i)[^"]*`)
			sb.WriteString(valueReplacer.Replace(v.value))
			sb.WriteString(`.*"`)
		}
	}
}
