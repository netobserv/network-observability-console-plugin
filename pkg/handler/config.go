package handler

import (
	"net/http"
	"os"

	"gopkg.in/yaml.v3"
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
}

type Loki struct {
	URL    string   `yaml:"url" json:"url"`
	Labels []string `yaml:"labels" json:"labels"`

	StatusURL          string `yaml:"statusUrl,omitempty" json:"statusUrl,omitempty"`
	Timeout            string `yaml:"timeout,omitempty" json:"timeout,omitempty"`
	TenantID           string `yaml:"tenantID,omitempty" json:"tenantID,omitempty"`
	TokenPath          string `yaml:"tokenPath,omitempty" json:"tokenPath,omitempty"`
	SkipTLS            bool   `yaml:"skipTls,omitempty" json:"skipTls,omitempty"`
	CAPath             string `yaml:"caPath,omitempty" json:"caPath,omitempty"`
	StatusSkipTLS      bool   `yaml:"statusSkipTls,omitempty" json:"statusSkipTls,omitempty"`
	StatusCAPath       string `yaml:"statusCaPath,omitempty" json:"statusCaPath,omitempty"`
	StatusUserCertPath string `yaml:"statusUserCertPath,omitempty" json:"statusUserCertPath,omitempty"`
	StatusUserKeyPath  string `yaml:"statusUserKeyPath,omitempty" json:"statusUserKeyPath,omitempty"`
	UseMocks           bool   `yaml:"useMocks,omitempty" json:"useMocks,omitempty"`
	ForwardUserToken   bool   `yaml:"forwardUserToken,omitempty" json:"forwardUserToken,omitempty"`
	AuthCheck          string `yaml:"authCheck,omitempty" json:"authCheck,omitempty"`
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
}

type Filter struct {
	ID        string `yaml:"id" json:"id"`
	Name      string `yaml:"name" json:"name"`
	Component string `yaml:"component" json:"component"`

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

type Frontend struct {
	BuildVersion    string        `yaml:"buildVersion" json:"buildVersion"`
	BuildDate       string        `yaml:"buildDate" json:"buildDate"`
	RecordTypes     []string      `yaml:"recordTypes" json:"recordTypes"`
	PortNaming      PortNaming    `yaml:"portNaming" json:"portNaming"`
	Columns         []Column      `yaml:"columns" json:"columns"`
	Filters         []Filter      `yaml:"filters" json:"filters"`
	QuickFilters    []QuickFilter `yaml:"quickFilters" json:"quickFilters"`
	AlertNamespaces []string      `yaml:"alertNamespaces" json:"alertNamespaces"`
	Sampling        int           `yaml:"sampling" json:"sampling"`
	Features        []string      `yaml:"features" json:"features"`
}

type Config struct {
	Loki     Loki     `yaml:"loki" json:"loki"`
	Frontend Frontend `yaml:"frontend" json:"frontend"`

	Server Server `yaml:"server,omitempty" json:"server,omitempty"`
}

func ReadConfigFile(version, date, filename string) (*Config, error) {
	//set default vales
	cfg := Config{
		Server: Server{
			Port:        9001,
			MetricsPort: 9002,
			CORSOrigin:  "*",
			CORSHeaders: "Origin, X-Requested-With, Content-Type, Accept",
		},
		Loki: Loki{
			Timeout:   "30s",
			AuthCheck: "auto",
		},
		Frontend: Frontend{
			BuildVersion: version,
			BuildDate:    date,
			RecordTypes:  []string{"flowLog"},
			Columns: []Column{
				{ID: "EndTime", Name: "End Time", Field: "TimeFlowEndMs", Default: true, Width: 15},
				{ID: "SrcAddr", Name: "IP", Group: "Source", Field: "SrcAddr", Default: true, Width: 15},
				{ID: "DstAddr", Name: "IP", Group: "Destination", Field: "DstAddr", Default: true, Width: 15},
			},
			Filters:      []Filter{},
			QuickFilters: []QuickFilter{},
			Features:     []string{},
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
	return &cfg, err
}

func GetFrontendConfig(version, date, filename string) func(w http.ResponseWriter, r *http.Request) {
	config, err := ReadConfigFile(version, date, filename)
	if err != nil {
		hlog.Errorf("Could not read config file: %v", err)
	}
	return func(w http.ResponseWriter, r *http.Request) {
		if err != nil {
			config, err = ReadConfigFile(version, date, filename)
			if err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
			} else {
				writeJSON(w, http.StatusOK, config.Frontend)
			}
		} else {
			writeJSON(w, http.StatusOK, config.Frontend)
		}
	}
}
