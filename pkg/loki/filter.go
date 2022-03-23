package loki

import (
	"fmt"
	"strings"
)

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

// func intLabelFilter(labelKey string, value int) labelFilter {
// 	return labelFilter{
// 		key:       labelKey,
// 		matcher:   labelEqual,
// 		value:     strconv.Itoa(value),
// 		valueType: typeNumber,
// 	}
// }

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
