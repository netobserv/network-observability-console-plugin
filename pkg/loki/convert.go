package loki

import (
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

var clog = logrus.WithField("component", "loki.convertToAnyMatch")

// convertToAnyMatch returns a new query with all the matchers and filters
// of the receiver query. The returned query would match if only one of the
// filters/attributes/selectors match.
func (q *Query) convertToAnyMatch() *Query {
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
		baseURL:      q.baseURL,
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
	out.labelFilters = append(q.streamSelector, q.labelFilters...)
	for _, lf := range q.lineFilters {
		label, ok := lineToLabelFilter(lf)
		if !ok {
			clog.WithField("lineFilter", lf).
				Warningf("line filter can't be parsed as json attribute. Ignoring it")
			continue
		}
		out.labelFilters = append(out.labelFilters, label)
	}
	return &out
}

// jsonField captures the fields of any Json argument.
// Second capture: name of the field.
// Third capture: JSON string value or empty
// Fourth capture: JSON number value or empty
var jsonField = regexp.MustCompile(`([\w.-]*)":(?:(?:"((?:(?:\^")|[^"])*)"?)|(\d+))$`)

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

	v := submatch[2]
	if !strings.HasSuffix(v, `"`) && !strings.HasSuffix(v, ".*") {
		v = v + ".*"
	}

	return labelFilter{
		key:       submatch[1],
		matcher:   labelMatches,
		value:     v,
		valueType: typeRegex,
	}, true
}
