package prometheus

import (
	"context"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
)

var (
	log = logrus.WithField("module", "prometheus")
)

type Inventory struct {
	config           *config.Prometheus
	availableMetrics []metricInfo
	mut              sync.RWMutex
}

type metricInfo struct {
	name       string
	labels     []string
	valueField string
	direction  string
}

func NewInventory(ctx context.Context, cfg *config.Prometheus) *Inventory {
	d := cfg.InventoryPollInterval.Duration
	if d == 0 {
		d = 2 * time.Minute
	}
	inv := Inventory{config: cfg}
	inv.fetchMetricsInventory(ctx)
	ticker := time.NewTicker(d)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				log.Debug("exiting inventory fetch loop due to context cancellation")
				return
			case <-ticker.C:
				inv.fetchMetricsInventory(ctx)
			}
		}
	}()
	return &inv
}

func (i *Inventory) fetchMetricsInventory(ctx context.Context) {
	promClient, err := NewClient(i.config, nil)
	if err != nil {
		log.Errorf("Error while checking metrics inventory (creating client): %v", err)
		return
	}
	resp, err := executeQuery(ctx, promClient, `count({__name__=~"netobserv.*"}) by (__name__)`)
	if err != nil {
		log.Errorf("Error while checking metrics inventory (executing query): %v", err)
		return
	}
	vec, ok := resp.(model.Vector)
	if !ok {
		log.Errorf("Error while checking metrics inventory (wrong return type: %T)", resp)
		return
	}

	var newAvailableMetrics []metricInfo
	for _, s := range vec {
		metricName := s.Metric["__name__"]
		if info := checkMetric(string(metricName)); info != nil {
			newAvailableMetrics = append(newAvailableMetrics, *info)
		}
	}

	i.mut.Lock()
	i.availableMetrics = newAvailableMetrics
	i.mut.Unlock()

	log.Infof("Fetched inventory: %v", i.availableMetrics)
}

func checkMetric(name string) *metricInfo {
	var valueField string
	if strings.Contains(name, "_drop_bytes_total") {
		valueField = fields.PktDropBytes
	} else if strings.Contains(name, "_drop_packets_total") {
		valueField = fields.PktDropPackets
	} else if strings.Contains(name, "_bytes_total") {
		valueField = fields.Bytes
	} else if strings.Contains(name, "_packets_total") {
		valueField = fields.Packets
	} else if strings.Contains(name, "_rtt_seconds_bucket") {
		valueField = fields.TimeFlowRTT
	} else if strings.Contains(name, "_dns_latency_seconds_bucket") {
		valueField = fields.DNSLatency
	}

	if valueField == "" {
		return nil
	}

	var dir string
	if strings.Contains(name, "_egress_") {
		dir = "??" // TODO: fixme
	} else if strings.Contains(name, "_ingress_") {
		dir = "??" // TODO: fixme
	} // TODO: else assume any direction?

	var labels []string
	if strings.Contains(name, "_workload_") {
		labels = []string{fields.SrcNamespace, fields.DstNamespace, fields.Layer, fields.SrcOwnerName, fields.DstOwnerName, fields.SrcOwnerType, fields.DstOwnerType, fields.SrcType, fields.DstType}
	} else if strings.Contains(name, "_namespace_") {
		labels = []string{fields.SrcNamespace, fields.DstNamespace, fields.Layer}
	} else if strings.Contains(name, "_node_") {
		labels = []string{fields.SrcHostName, fields.DstHostName}
	} else {
		return nil
	}

	return &metricInfo{
		name:       name,
		valueField: valueField,
		direction:  dir,
		labels:     labels,
	}
}

func (i *Inventory) FindMetricName(neededLabels []string, value, dir string) string {
	i.mut.RLock()
	defer i.mut.RUnlock()
	for _, m := range i.availableMetrics {
		if value != m.valueField /* || dir != m.direction TODO: FIXME*/ {
			continue
		}
		allMatch := true
		for _, neededLabel := range neededLabels {
			if !slices.Contains(m.labels, neededLabel) {
				allMatch = false
				break
			}
		}
		if allMatch {
			return m.name
		}
	}
	log.Debugf("No metric match for %v / %s / %s", neededLabels, value, dir)
	return ""
}
