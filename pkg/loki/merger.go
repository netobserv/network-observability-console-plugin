package loki

import (
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

type Merger interface {
	Add(from model.QueryResponseData) (model.ResultValue, error)
	Get() *model.AggregatedQueryResponse
}
