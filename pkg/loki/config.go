package loki

import (
	"net/url"
	"os"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
	"github.com/sirupsen/logrus"
)

var log = logrus.WithField("module", "loki config")

type Config struct {
	URL              *url.URL
	StatusURL        *url.URL
	Timeout          time.Duration
	TenantID         string
	Authorization    string
	SkipTLS          bool
	CAPath           string
	UseMocks         bool
	ForwardUserToken bool
	Labels           map[string]struct{}
}

func NewConfig(url *url.URL, statusURL *url.URL, timeout time.Duration, tenantID string, tokenPath string, forwardUserToken bool, skipTLS bool, capath string, useMocks bool, labels []string) Config {
	authorization := ""
	if tokenPath != "" {
		bytes, err := os.ReadFile(tokenPath)
		if err != nil {
			log.WithError(err).Fatalf("failed to parse authorization path: %s", tokenPath)
		}
		authorization = "Bearer " + string(bytes)
	}

	return Config{
		URL:              url,
		StatusURL:        statusURL,
		Timeout:          timeout,
		TenantID:         tenantID,
		Authorization:    authorization,
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
