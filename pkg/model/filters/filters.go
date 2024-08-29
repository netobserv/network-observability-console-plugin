package filters

import (
	"net/url"
	"strings"
)

// MultiQueries is an union group of singleQueries (OR'ed)
type MultiQueries []SingleQuery

// singleQuery is an intersect group of matches (AND'ed)
type SingleQuery = []Match

type Match struct {
	Key             string
	Values          string
	Not             bool
	MoreThanOrEqual bool
}

func NewMatch(key, values string) Match { return Match{Key: key, Values: values} }
func NewNotMatch(key, values string) Match {
	return Match{Key: key, Values: values, Not: true, MoreThanOrEqual: false}
}
func NewMoreThanOrEqualMatch(key, values string) Match {
	return Match{Key: key, Values: values, Not: false, MoreThanOrEqual: true}
}

// Example of raw filters (url-encoded):
// foo=a,b&bar=c|baz=d
// Produces:
// [ [ ["foo", "a,b"], ["bar", "c"]], [["baz", "d"]]]
// ^ ^ ^
// | | '--- Per-label OR:  "foo" must have value "a" OR "b"
// | '----- In-group AND:  "foo" must be "a" or "b" AND "bar" must be "c"
// '------- All groups OR: "foo" must be "a" or "b" AND "bar" must be "c", OR "baz" must be "d"
func Parse(raw string) (MultiQueries, error) {
	var parsed []SingleQuery
	decoded, err := url.QueryUnescape(raw)
	if err != nil {
		return nil, err
	}
	groups := strings.Split(decoded, "|")
	for _, group := range groups {
		var andFilters []Match
		filters := strings.Split(group, "&")
		for _, filter := range filters {
			pair := strings.Split(filter, "=")
			if len(pair) == 2 {
				if strings.HasSuffix(pair[0], "!") {
					andFilters = append(andFilters, NewNotMatch(strings.TrimSuffix(pair[0], "!"), pair[1]))
				} else if strings.HasSuffix(pair[0], ">") {
					andFilters = append(andFilters, NewMoreThanOrEqualMatch(strings.TrimSuffix(pair[0], ">"), pair[1]))
				} else {
					andFilters = append(andFilters, NewMatch(pair[0], pair[1]))
				}
			}
		}
		parsed = append(parsed, andFilters)
	}
	return parsed, nil
}

// Distribute allows to inject and "expand" queries with new filters.
// For example, say we have an initial query `q` with just "{{src-name=foo}}" and we want to enforce source OR dest namespace being "my-namespace". We'd write:
// `q.Distribute({{src-namespace="my-namespace"}, {dst-namespace="my-namespace"}})`
// Which results in: "{{src-namespace="my-namespace", src-name=foo}, {dst-namespace="my-namespace", src-name=foo}}"
func (m MultiQueries) Distribute(toDistribute []SingleQuery, ignorePred func(SingleQuery) bool) MultiQueries {
	result := MultiQueries{}
	for _, qOrig := range m {
		if ignorePred(qOrig) {
			result = append(result, qOrig)
			continue
		}
		for _, qToDistribute := range toDistribute {
			qDistributed := qToDistribute
			qDistributed = append(qDistributed, qOrig...)
			result = append(result, qDistributed)
		}
	}
	return result
}

func (m *Match) ToLabelFilter() (LabelFilter, bool) {
	values := strings.Split(m.Values, ",")
	if len(values) == 1 && isExactMatch(values[0]) {
		if m.Not {
			return NotStringLabelFilter(m.Key, trimExactMatch(values[0])), true
		} else if m.MoreThanOrEqual {
			return MoreThanNumberLabelFilter(m.Key, trimExactMatch(values[0])), true
		}
		return StringEqualLabelFilter(m.Key, trimExactMatch(values[0])), true
	}
	return MultiValuesRegexFilter(m.Key, values, m.Not)
}

func isExactMatch(value string) bool {
	return strings.HasPrefix(value, `"`) && strings.HasSuffix(value, `"`)
}

func trimExactMatch(value string) string {
	return strings.TrimPrefix(strings.TrimSuffix(value, `"`), `"`)
}
