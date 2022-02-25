package loki

import (
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

var clog = logrus.WithField("component", "loki.convertTo")

// convertTo returns a new query with all the matchers and filters
// of the receiver query.
func (q *Query) convertTo() *Query {
	// if the input query only has zero or one criterion, or it only has Label filters,
	// we return a copy by changing the Label Joiner
	if len(q.lineFilters)+len(q.labelFilters)+len(q.streamSelector) <= 1 ||
		len(q.streamSelector)+len(q.lineFilters) == 0 {
		// return a copy of the input query, just changing the label joiner
		cp := *q
		cp.labelJoiner = joinOr
		return &cp
	}

	out := Query{
		urlParams:    q.urlParams,
		labelJoiner:  joinOr,
		specialAttrs: q.specialAttrs,
	}
	// if the input query only has line filters, we merge them into a single
	// regexp and return it
	if len(q.labelFilters)+len(q.streamSelector) == 0 {
		out.lineFilters = []string{
			"(" + strings.Join(q.lineFilters, ")|(") + ")",
		}
		return &out
	}
	// otherwise, we move all the arguments to Label filters to be checked after JSON conversion
	labelFilters := append(q.streamSelector, q.labelFilters...)
	for _, lf := range q.lineFilters {
		label, ok := lineToLabelFilter(lf)
		if !ok {
			clog.WithField("lineFilter", lf).
				Warningf("line filter can't be parsed as json attribute. Ignoring it")
			continue
		}
		labelFilters = append(labelFilters, label)
	}

	//group labelFilters by Src / Dst
	if q.specialAttrs[matchParam] == srcOrDstMatchValue {
		// each value of group must match
		out.labelJoiner = joinAnd
		var i int
		indexes := map[string]int{}
		for _, lf := range labelFilters {
			// group labels by Src / Dst / Other
			out.groupedLabelFilters, i = getIndex(lf.key, indexes, out.groupedLabelFilters)
			// The returned query would match if all
			// filters/attributes/selectors match in any group.
			out.groupedLabelFilters[i] = append(out.groupedLabelFilters[i], lf)
		}
	} else {
		// The returned query would match if only one of the
		// filters/attributes/selectors match.
		out.labelFilters = labelFilters
	}
	return &out
}

// jsonField captures the fields of any Json argument.
// Second capture: name of the field.
// Third capture: JSON string value or empty
// Fourth capture: JSON number value or empty
var jsonField = regexp.MustCompile(`^"([\w.-]*)":(?:(?:"((?:(?:\^")|[^"])*)"?)|(\d+))$`)

// lineToLabelFilter extracts the JSON field name and value from a line filter and converts
// it to a labelFilter
func lineToLabelFilter(lf string) (labelFilter, bool) {
	submatch := jsonField.FindStringSubmatch(lf)
	if len(submatch) == 0 {
		return labelFilter{}, false
	}
	if len(submatch[3]) > 0 {
		return labelFilter{
			key:       submatch[1],
			matcher:   labelEqual,
			value:     submatch[3],
			valueType: typeNumber,
		}, true
	}

	// TODO: if at some point we want to filter by exact string values, we should
	// conditionally replace the matcher and remove the .* suffix
	value := submatch[2]
	if !strings.HasSuffix(value, ".*") {
		value = value + ".*"
	}

	return labelFilter{
		key: submatch[1],

		matcher:   labelMatches,
		value:     value,
		valueType: typeRegex,
	}, true
}

func getIndex(label string, indexes map[string]int, groupedArray [][]labelFilter) ([][]labelFilter, int) {
	var key string
	if strings.HasPrefix(label, "Src") {
		key = "Src"
	} else if strings.HasPrefix(label, "Dst") {
		key = "Dst"
	} else {
		key = ""
	}
	if _, hasKey := indexes[key]; !hasKey {
		indexes[key] = len(groupedArray)
		groupedArray = append(groupedArray, []labelFilter{})
	}
	return groupedArray, indexes[key]
}
