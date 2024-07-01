package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/client"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils/constants"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

var (
	log = logrus.WithField("module", "config")
)

type Server struct {
	Port        int    `yaml:"port,omitempty" json:"port,omitempty"`
	MetricsPort int    `yaml:"metricsPort,omitempty" json:"metricsPort,omitempty"`
	CertPath    string `yaml:"certPath,omitempty" json:"certPath,omitempty"`
	KeyPath     string `yaml:"keyPath,omitempty" json:"keyPath,omitempty"`
	CORSOrigin  string `yaml:"corsOrigin,omitempty" json:"corsOrigin,omitempty"`
	CORSMethods string `yaml:"corsMethods,omitempty" json:"corsMethods,omitempty"`
	CORSHeaders string `yaml:"corsHeaders,omitempty" json:"corsHeaders,omitempty"`
	CORSMaxAge  string `yaml:"corsMaxAge,omitempty" json:"corsMaxAge,omitempty"`
	AuthCheck   string `yaml:"authCheck,omitempty" json:"authCheck,omitempty"`
}

type Prometheus struct {
	URL              string       `yaml:"url" json:"url"`
	Timeout          Duration     `yaml:"timeout,omitempty" json:"timeout,omitempty"`
	TokenPath        string       `yaml:"tokenPath,omitempty" json:"tokenPath,omitempty"`
	SkipTLS          bool         `yaml:"skipTls,omitempty" json:"skipTls,omitempty"`
	CAPath           string       `yaml:"caPath,omitempty" json:"caPath,omitempty"`
	ForwardUserToken bool         `yaml:"forwardUserToken,omitempty" json:"forwardUserToken,omitempty"`
	Metrics          []MetricInfo `yaml:"metrics,omitempty" json:"metrics,omitempty"`
}

type FlowDirection string

const (
	Egress       FlowDirection = "Egress"
	Ingress      FlowDirection = "Ingress"
	AnyDirection FlowDirection = "Any"
)

type MetricInfo struct {
	Enabled    bool          `yaml:"enabled" json:"enabled"`
	Name       string        `yaml:"name,omitempty" json:"name,omitempty"`
	Type       string        `yaml:"type,omitempty" json:"type,omitempty"`
	ValueField string        `yaml:"valueField,omitempty" json:"valueField,omitempty"`
	Direction  FlowDirection `yaml:"direction,omitempty" json:"direction,omitempty"`
	Labels     []string      `yaml:"labels,omitempty" json:"labels,omitempty"`
}

type PortNaming struct {
	Enable    bool              `yaml:"enable" json:"enable"`
	PortNames map[string]string `yaml:"portNames" json:"portNames"`
}

type Column struct {
	ID   string `yaml:"id" json:"id"`
	Name string `yaml:"name" json:"name"`

	Group      string   `yaml:"group,omitempty" json:"group,omitempty"`
	Field      string   `yaml:"field,omitempty" json:"field,omitempty"`
	Fields     []string `yaml:"fields,omitempty" json:"fields,omitempty"`
	Calculated string   `yaml:"calculated,omitempty" json:"calculated,omitempty"`
	Tooltip    string   `yaml:"tooltip,omitempty" json:"tooltip,omitempty"`
	DocURL     string   `yaml:"docURL,omitempty" json:"docURL,omitempty"`
	Filter     string   `yaml:"filter,omitempty" json:"filter,omitempty"`
	Default    bool     `yaml:"default,omitempty" json:"default,omitempty"`
	Width      int      `yaml:"width,omitempty" json:"width,omitempty"`
	Feature    string   `yaml:"feature" json:"feature"`
}

type Filter struct {
	ID                     string `yaml:"id" json:"id"`
	Name                   string `yaml:"name" json:"name"`
	Component              string `yaml:"component" json:"component"`
	Category               string `yaml:"category,omitempty" json:"category,omitempty"`
	AutoCompleteAddsQuotes bool   `yaml:"autoCompleteAddsQuotes,omitempty" json:"autoCompleteAddsQuotes,omitempty"`
	Hint                   string `yaml:"hint,omitempty" json:"hint,omitempty"`
	Examples               string `yaml:"examples,omitempty" json:"examples,omitempty"`
	DocURL                 string `yaml:"docUrl,omitempty" json:"docUrl,omitempty"`
	Placeholder            string `yaml:"placeholder,omitempty" json:"placeholder,omitempty"`
}

type QuickFilter struct {
	Name   string            `yaml:"name" json:"name"`
	Filter map[string]string `yaml:"filter" json:"filter"`

	Default bool `yaml:"default,omitempty" json:"default,omitempty"`
}

type FieldConfig struct {
	Name        string `yaml:"name" json:"name"`
	Type        string `yaml:"type" json:"type"`
	Description string `yaml:"description" json:"description"`
	// lokiLabel flag is for documentation only. Use loki.labels instead
	Filter string `yaml:"filter,omitempty" json:"filter,omitempty"`
}

type Deduper struct {
	Mark  bool `yaml:"mark" json:"mark"`
	Merge bool `yaml:"merge" json:"merge"`
}

type Frontend struct {
	BuildVersion    string        `yaml:"buildVersion" json:"buildVersion"`
	BuildDate       string        `yaml:"buildDate" json:"buildDate"`
	RecordTypes     []string      `yaml:"recordTypes" json:"recordTypes"`
	PortNaming      PortNaming    `yaml:"portNaming" json:"portNaming"`
	Panels          []string      `yaml:"panels" json:"panels"`
	Columns         []Column      `yaml:"columns" json:"columns"`
	Filters         []Filter      `yaml:"filters" json:"filters"`
	QuickFilters    []QuickFilter `yaml:"quickFilters" json:"quickFilters"`
	AlertNamespaces []string      `yaml:"alertNamespaces" json:"alertNamespaces"`
	Sampling        int           `yaml:"sampling" json:"sampling"`
	Features        []string      `yaml:"features" json:"features"`
	Deduper         Deduper       `yaml:"deduper" json:"deduper"`
	Fields          []FieldConfig `yaml:"fields" json:"fields"`
	DataSources     []string      `yaml:"dataSources" json:"dataSources"`
	PromLabels      []string      `yaml:"promLabels" json:"promLabels"`
	MaxChunkAgeMs   int           `yaml:"maxChunkAgeMs,omitempty" json:"maxChunkAgeMs,omitempty"` // populated at query time
}

type Config struct {
	Loki       Loki       `yaml:"loki" json:"loki"`
	Prometheus Prometheus `yaml:"prometheus" json:"prometheus"`
	Frontend   Frontend   `yaml:"frontend" json:"frontend"`
	Server     Server     `yaml:"server,omitempty" json:"server,omitempty"`
	Path       string     `yaml:"-" json:"-"`
}

func ReadFile(version, date, filename string) (*Config, error) {
	// set default values
	cfg := Config{
		Path: filename,
		Server: Server{
			Port:        9001,
			MetricsPort: 9002,
			CORSOrigin:  "*",
			CORSHeaders: "Origin, X-Requested-With, Content-Type, Accept",
			AuthCheck:   "auto",
		},
		Loki: Loki{
			Timeout: Duration{Duration: 30 * time.Second},
		},
		Prometheus: Prometheus{
			Timeout: Duration{Duration: 30 * time.Second},
		},
		Frontend: Frontend{
			BuildVersion: version,
			BuildDate:    date,
			RecordTypes:  []string{"flowLog"},
			Panels:       []string{},
			Columns: []Column{
				{ID: "EndTime", Name: "End Time", Field: "TimeFlowEndMs", Default: true, Width: 15},
				{ID: "SrcAddr", Name: "IP", Group: "Source", Field: "SrcAddr", Default: true, Width: 15},
				{ID: "DstAddr", Name: "IP", Group: "Destination", Field: "DstAddr", Default: true, Width: 15},
			},
			Filters:      []Filter{},
			QuickFilters: []QuickFilter{},
			Features:     []string{},
			Deduper: Deduper{
				Mark:  false,
				Merge: true,
			},
			Fields: []FieldConfig{
				{Name: "TimeFlowEndMs", Type: "number"},
				{Name: "SrcAddr", Type: "string"},
				{Name: "DstAddr", Type: "string"},
			},
			DataSources: []string{},
			PromLabels:  []string{},
		},
	}
	if len(filename) == 0 {
		return &cfg, nil
	}
	yamlFile, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	err = yaml.Unmarshal(yamlFile, &cfg)
	if err != nil {
		return nil, err
	}

	if cfg.IsLokiEnabled() {
		cfg.Frontend.DataSources = append(cfg.Frontend.DataSources, string(constants.DataSourceLoki))
	}

	if cfg.IsPromEnabled() {
		cfg.Frontend.DataSources = append(cfg.Frontend.DataSources, string(constants.DataSourceProm))
		labels := make(map[string]any)
		for _, m := range cfg.Prometheus.Metrics {
			if m.Enabled {
				for _, l := range m.Labels {
					labels[l] = true
				}
			}
		}
		for k := range labels {
			cfg.Frontend.PromLabels = append(cfg.Frontend.PromLabels, k)
		}
	}

	return &cfg, err
}

func (c *Config) IsLokiEnabled() bool {
	return c.Loki.URL != ""
}

func (c *Config) IsPromEnabled() bool {
	return c.Prometheus.URL != ""
}

func (c *Config) Validate() error {
	if !c.IsLokiEnabled() && !c.IsPromEnabled() {
		return errors.New("neither Loki nor Prometheus is configured; at least one of them should have a URL defined")
	}

	var configErrors []string

	if c.IsLokiEnabled() {
		log.Infof("Loki is enabled (%s)", c.Loki.URL)
		// check config required fields
		if len(c.Loki.Labels) == 0 {
			configErrors = append(configErrors, "labels cannot be empty")
		}

		// parse config urls
		_, err := url.Parse(c.Loki.URL)
		if err != nil {
			configErrors = append(configErrors, "wrong Loki URL")
		}
		if len(c.Loki.StatusURL) > 0 {
			_, err := url.Parse(c.Loki.StatusURL)
			if err != nil {
				configErrors = append(configErrors, "wrong Loki status URL")
			}
		}
	} else {
		log.Info("Loki is disabled")
	}

	if c.IsPromEnabled() {
		log.Infof("Prometheus is enabled (%s)", c.Prometheus.URL)
		// parse config urls
		_, err := url.Parse(c.Prometheus.URL)
		if err != nil {
			configErrors = append(configErrors, "wrong Prometheus URL")
		}
	} else {
		log.Info("Prometheus is disabled")
	}

	if len(configErrors) > 0 {
		configErrors = append([]string{fmt.Sprintf("Config file has %d errors:\n", len(configErrors))}, configErrors...)
		return errors.New(strings.Join(configErrors, "\n - "))
	}

	return nil
}

func (c *Config) GetAuthChecker() (auth.Checker, error) {
	// parse config auth
	var checkType auth.CheckType
	if c.Server.AuthCheck == "auto" {
		// FORWARD mode
		checkType = auth.CheckAuthenticated
		if (c.IsLokiEnabled() && !c.Loki.ForwardUserToken) ||
			(c.IsPromEnabled() && !c.Prometheus.ForwardUserToken) {
			// HOST or DISABLED mode
			checkType = auth.CheckAdmin
		}
		log.Info(fmt.Sprintf("auth-check 'auto' resolved to '%s'", checkType))
	} else {
		checkType = auth.CheckType(c.Server.AuthCheck)
	}
	if checkType == auth.CheckNone {
		log.Warn("INSECURE: auth checker is disabled")
	}
	return auth.NewChecker(checkType, client.NewInCluster)
}
