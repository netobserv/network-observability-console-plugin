package loki

import (
	"net/url"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

type Config struct {
	URL              *url.URL
	StatusURL        *url.URL
	Timeout          time.Duration
	TenantID         string
	TokenPath        string
	SkipTLS          bool
	CAPath           string
	UseMocks         bool
	ForwardUserToken bool
	Labels           map[string]struct{}
}

func NewConfig(url *url.URL, statusURL *url.URL, timeout time.Duration, tenantID string, tokenPath string, forwardUserToken bool, skipTLS bool, capath string, useMocks bool, labels []string) Config {
	return Config{
		URL:              url,
		StatusURL:        statusURL,
		Timeout:          timeout,
		TenantID:         tenantID,
		TokenPath:        tokenPath,
		SkipTLS:          skipTLS,
		CAPath:           capath,
		UseMocks:         useMocks,
		ForwardUserToken: forwardUserToken,
		Labels:           utils.GetMapInterface(labels),
	}
}

func (c *Config) IsLabel(key string) bool {
	_, isLabel := c.Labels[key]
	return isLabel
}
