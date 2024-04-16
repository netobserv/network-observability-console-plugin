package config

import "github.com/netobserv/network-observability-console-plugin/pkg/utils"

type Loki struct {
	URL                string   `yaml:"url" json:"url"`
	Labels             []string `yaml:"labels" json:"labels"`
	StatusURL          string   `yaml:"statusUrl,omitempty" json:"statusUrl,omitempty"`
	Timeout            Duration `yaml:"timeout,omitempty" json:"timeout,omitempty"`
	TenantID           string   `yaml:"tenantID,omitempty" json:"tenantID,omitempty"`
	TokenPath          string   `yaml:"tokenPath,omitempty" json:"tokenPath,omitempty"`
	SkipTLS            bool     `yaml:"skipTls,omitempty" json:"skipTls,omitempty"`
	CAPath             string   `yaml:"caPath,omitempty" json:"caPath,omitempty"`
	StatusSkipTLS      bool     `yaml:"statusSkipTls,omitempty" json:"statusSkipTls,omitempty"`
	StatusCAPath       string   `yaml:"statusCaPath,omitempty" json:"statusCaPath,omitempty"`
	StatusUserCertPath string   `yaml:"statusUserCertPath,omitempty" json:"statusUserCertPath,omitempty"`
	StatusUserKeyPath  string   `yaml:"statusUserKeyPath,omitempty" json:"statusUserKeyPath,omitempty"`
	UseMocks           bool     `yaml:"useMocks,omitempty" json:"useMocks,omitempty"`
	ForwardUserToken   bool     `yaml:"forwardUserToken,omitempty" json:"forwardUserToken,omitempty"`
	AuthCheck          string   `yaml:"authCheck,omitempty" json:"authCheck,omitempty"`
	labelsMap          map[string]struct{}
}

func (l *Loki) GetStatusURL() string {
	if l.StatusURL != "" {
		return l.StatusURL
	}
	return l.URL
}

func (l *Loki) IsLabel(key string) bool {
	if l.labelsMap == nil {
		l.labelsMap = utils.GetMapInterface(l.Labels)
	}
	_, isLabel := l.labelsMap[key]
	return isLabel
}
