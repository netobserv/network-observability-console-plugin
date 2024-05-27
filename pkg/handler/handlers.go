package handler

import (
	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/prometheus"
)

type Handlers struct {
	Cfg           *config.Config
	PromInventory *prometheus.Inventory
}
