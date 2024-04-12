package prometheus

import (
	"slices"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
	"github.com/sirupsen/logrus"
)

var (
	log = logrus.WithField("module", "prometheus")
)

type Inventory struct {
	metrics []config.MetricInfo
}

func NewInventory(cfg *config.Prometheus) *Inventory {
	var toAppend []config.MetricInfo
	for i := range cfg.Metrics {
		// Add DNS counter(s)
		if strings.Contains(cfg.Metrics[i].Name, "_dns_latency_seconds") {
			cpy := cfg.Metrics[i]
			cpy.Name += "_count"
			cpy.ValueField = constants.MetricTypeDNSFlows
			toAppend = append(toAppend, cpy)
		}
	}
	return &Inventory{metrics: append(cfg.Metrics, toAppend...)}
}

func (i *Inventory) FindMetricName(neededLabels []string, value, dir string) string {
	for _, m := range i.metrics {
		if !m.Enabled {
			continue
		}
		if checkMatch(&m, neededLabels, value, dir) {
			return m.Name
		}
	}
	log.Debugf("No metric match for %v / %s (/ %s)", neededLabels, value, dir)
	return ""
}

func (i *Inventory) FindDisabledCandidates(neededLabels []string, value, dir string) []string {
	var names []string
	for _, m := range i.metrics {
		if !m.Enabled && checkMatch(&m, neededLabels, value, dir) {
			names = append(names, strings.TrimPrefix(m.Name, "netobserv_"))
		}
	}
	return names
}

func checkMatch(metric *config.MetricInfo, neededLabels []string, value, dir string) bool {
	if value != metric.ValueField /* || dir != m.direction TODO: FIXME*/ {
		return false
	}
	for _, neededLabel := range neededLabels {
		if !slices.Contains(metric.Labels, neededLabel) {
			return false
		}
	}
	return true
}
