package filters

import (
	"net/url"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
)

// MultiQueries is an union group of singleQueries (OR'ed)
type MultiQueries = []SingleQuery

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

func SplitForReportersMerge(q SingleQuery) (SingleQuery, SingleQuery) {
	// If FlowDirection is enforced, skip merging both reporters
	for _, m := range q {
		if m.Key == fields.FlowDirection {
			return q, nil
		}
	}
	// The rationale here is that most traffic is duplicated from ingress and egress PoV, except cluster-external traffic.
	// Merging is done by running a first query with FlowDirection=EGRESS and another with FlowDirection=INGRESS AND SrcOwnerName is empty,
	// which stands for cluster-external.
	// (Note that we use SrcOwnerName both as an optimization as it's a Loki index,
	// and as convenience because looking for empty fields won't work if they aren't indexed)
	q1 := SingleQuery{
		NewMatch(fields.FlowDirection, `"`+constants.Egress+`"`),
	}
	q2 := SingleQuery{
		NewMatch(fields.FlowDirection, `"`+constants.Ingress+`"`),
		NewMatch(fields.SrcOwnerName, `""`),
	}
	for _, m := range q {
		q1 = append(q1, m)
		q2 = append(q2, m)
	}
	return q1, q2
}
