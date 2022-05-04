package loki

import (
	"net/url"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

type Config struct {
	URL      *url.URL
	Timeout  time.Duration
	TenantID string
	SkipTLS  bool
	Labels   map[string]struct{}
}

func NewConfig(url *url.URL, timeout time.Duration, tenantID string, skipTLS bool, labels []string) Config {
	return Config{
		URL:      url,
		Timeout:  timeout,
		TenantID: tenantID,
		SkipTLS:  skipTLS,
		Labels:   utils.GetMapInterface(labels),
	}
}

func (c *Config) IsLabel(key string) bool {
	_, isLabel := c.Labels[key]
	return isLabel
}
