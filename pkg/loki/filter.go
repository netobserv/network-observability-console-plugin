package loki

import (
	"fmt"
	"strconv"
	"strings"
)

// remove quotes and replace * by regex any
var valueReplacer = strings.NewReplacer(`*`, `.*`, `"`, "")

type labelMatcher string

const (
	labelEqual           = labelMatcher("=")
	labelMatches         = labelMatcher("=~")
	labelNotEqual        = labelMatcher("!=")
	labelMoreThanOrEqual = labelMatcher(">=")
	labelNoMatches       = labelMatcher("!~")
)

type valueType int

const (
	typeNumber valueType = iota
	typeString
	typeRegex
	typeRegexContains
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

// lineFilter represents a condition based on a JSON raw text match.
type lineFilter struct {
	key       string
	strictKey bool
	values    []lineMatch
	not       bool
	moreThan  bool
}

type lineMatch struct {
	value     string
	valueType valueType
}

func stringEqualLabelFilter(labelKey string, value string) labelFilter {
	return labelFilter{
		key:       labelKey,
		matcher:   labelEqual,
		value:     value,
		valueType: typeString,
	}
}

func stringMatchLalbeFilter(labelKey string, value string) labelFilter {
	return labelFilter{
		key:       labelKey,
		matcher:   labelMatches,
		value:     value,
		valueType: typeString,
	}
}

func notStringLabelFilter(labelKey string, value string) labelFilter {
	return labelFilter{
		key:       labelKey,
		matcher:   labelNotEqual,
		value:     value,
		valueType: typeString,
	}
}

func moreThanNumberLabelFilter(labelKey string, value string) labelFilter {
	return labelFilter{
		key:       labelKey,
		matcher:   labelMoreThanOrEqual,
		value:     value,
		valueType: typeNumber,
	}
}

func stringNotMatchLabelFilter(labelKey string, value string) labelFilter {
	return labelFilter{
		key:       labelKey,
		matcher:   labelNoMatches,
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
	case typeNumber, typeRegex:
		sb.WriteString(f.value)
	case typeString:
		sb.WriteByte('"')
		sb.WriteString(f.value)
		sb.WriteByte('"')
	case typeIP:
		sb.WriteString(`ip("`)
		sb.WriteString(f.value)
		sb.WriteString(`")`)
	case typeRegexContains:
		sb.WriteString("`(?i).*")
		sb.WriteString(f.value)
		sb.WriteString(".*`")
	default:
		panic(fmt.Sprint("wrong filter value type", int(f.valueType)))
	}
}

// asLabelFilters transforms a lineFilter (raw text match) into a group of
// labelFilters (attributes match)
func (f *lineFilter) asLabelFilters() []labelFilter {
	lfs := make([]labelFilter, 0, len(f.values))
	for _, v := range f.values {
		lf := labelFilter{
			key:       f.key,
			valueType: v.valueType,
			value:     v.value,
		}
		if v.valueType == typeRegex || v.valueType == typeRegexContains {
			if f.not {
				lf.matcher = labelNoMatches
			} else {
				lf.matcher = labelMatches
			}
		} else {
			if f.not {
				lf.matcher = labelNotEqual
			} else if f.moreThan {
				lf.matcher = labelMoreThanOrEqual
			} else {
				lf.matcher = labelEqual
			}
		}
		lfs = append(lfs, lf)
	}
	return lfs
}

func numberMatchLineFilter(key string, strictKey bool, value string) lineFilter {
	return lineFilter{
		key:       key,
		strictKey: strictKey,
		values: []lineMatch{{
			valueType: typeNumber,
			value:     value,
		}},
	}
}

func regexMatchLineFilter(key string, strictKey bool, value string) lineFilter {
	return lineFilter{
		key:       key,
		strictKey: strictKey,
		values: []lineMatch{{
			valueType: typeRegex,
			value:     value,
		}},
	}
}

func notContainsKeyLineFilter(key string) lineFilter {
	return lineFilter{
		key:       key,
		strictKey: true,
		not:       true,
		moreThan:  false,
	}
}

// writeInto transforms a lineFilter to its corresponding part of a LogQL query
// under construction (contained in the provided strings.Builder)
func (f *lineFilter) writeInto(sb *strings.Builder) {
	if f.not {
		// the record must contains the field if values are specified
		// since FLP skip empty fields / zeros values
		if len(f.values) > 0 {
			sb.WriteString("|~`\"")
			sb.WriteString(f.key)
			sb.WriteString("\"`")
		}

		// then we exclude match results
		sb.WriteString("!~`")
	} else {
		sb.WriteString("|~`")
	}

	if len(f.values) == 0 {
		// match only the end of KEY if not 'strictKey'
		// no value will be provided here as we only check if key exists
		if f.strictKey {
			sb.WriteByte('"')
		}
		sb.WriteString(f.key)
		sb.WriteString(`"`)
	} else {
		for i, v := range f.values {
			if i > 0 {
				sb.WriteByte('|')
			}

			// match only the end of KEY + regex VALUE if not 'strictKey'
			// if numeric, KEY":VALUE,
			// if string KEY":"VALUE"
			// ie 'Port' key will match both 'SrcPort":"XXX"' and 'DstPort":"XXX"
			// VALUE can be quoted for exact match or contains * to inject regex any
			// For numeric values, exact match is implicit
			// 	(the trick is to match for the ending coma; it works as long as the filtered field
			// 	is not the last one (they're in alphabetic order); a less performant alternative
			// 	but more future-proof/less hacky could be to move that to a json filter, if needed)
			if f.strictKey {
				sb.WriteByte('"')
			}
			sb.WriteString(f.key)
			sb.WriteString(`":`)
			switch v.valueType {
			case typeNumber, typeRegex:
				if f.moreThan {
					// match each number greater than specified value using regex
					// ie example for 23+ you should get:
					// ([2-9][3-9] | [3-9][0-9]+?)
					//       |            |
					//       |            ↪ match numbers >= 30
					//       |
					//       ↪ match any number from 23 to 29
					sb.WriteRune('(')
					for _, r := range v.value {
						sb.WriteRune('[')
						sb.WriteRune(r)
						if r != '9' {
							sb.WriteString("-9]")
						} else {
							sb.WriteRune(']')
						}
					}
					if len(v.value) > 0 {
						intVal, _ := strconv.Atoi(v.value)
						nextMatch := fmt.Sprintf("%d", (int((intVal/10)+1) * 10))
						sb.WriteRune('|')
						for _, r := range nextMatch {
							sb.WriteRune('[')
							sb.WriteRune(r)
							if r != '9' {
								sb.WriteString("-9]")
							} else {
								sb.WriteRune(']')
							}
						}
						sb.WriteString("+?)")
					}
				} else {
					sb.WriteString(v.value)
				}
				// a number or regex can be followed by } if it's the last property of a JSON document
				sb.WriteString("[,}]")
			case typeString, typeIP:
				// exact matches are specified as just strings
				sb.WriteByte('"')
				sb.WriteString(valueReplacer.Replace(v.value))
				sb.WriteByte('"')
			// contains-match are specified as regular expressions
			case typeRegexContains:
				sb.WriteString(`"(?i)[^"]*`)
				sb.WriteString(valueReplacer.Replace(v.value))
				sb.WriteString(`.*"`)
			}
		}
	}
	sb.WriteRune('`')
}
