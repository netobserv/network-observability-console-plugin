package filters

import (
	"net/url"
	"strings"
)

// MultiQueries is an union group of singleQueries (OR'ed)
type MultiQueries = []SingleQuery

// singleQuery is an intersect group of matches (AND'ed)
type SingleQuery = []Match

type Match struct {
	Key    string
	Values string
	Not    bool
}

func NewMatch(key, values string) Match    { return Match{Key: key, Values: values} }
func NewNotMatch(key, values string) Match { return Match{Key: key, Values: values, Not: true} }

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
				} else {
					andFilters = append(andFilters, NewMatch(pair[0], pair[1]))
				}
			}
		}
		parsed = append(parsed, andFilters)
	}
	return parsed, nil
}
