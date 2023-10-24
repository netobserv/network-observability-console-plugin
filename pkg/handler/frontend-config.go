package handler

import (
	"net/http"
	"os"

	"gopkg.in/yaml.v3"
)

type Column struct {
	Id         string `yaml:"id,omitempty" json:"id"`
	Group      string `yaml:"group,omitempty" json:"group"`
	Name       string `yaml:"name,omitempty" json:"name"`
	Field      string `yaml:"field,omitempty" json:"field"`
	Calculated string `yaml:"calculated,omitempty" json:"calculated"`
	Tooltip    string `yaml:"tooltip,omitempty" json:"tooltip"`
	DocURL     string `yaml:"docURL,omitempty" json:"docURL"`
	Filter     string `yaml:"filter,omitempty" json:"filter"`
	Default    bool   `yaml:"default,omitempty" json:"default"`
	Width      int    `yaml:"width,omitempty" json:"width"`
}

type QuickFilter struct {
	Name    string            `yaml:"name,omitempty" json:"name"`
	Filter  map[string]string `yaml:"filter,omitempty" json:"filter"`
	Default bool              `yaml:"default,omitempty" json:"default"`
}

type Filter struct {
	Id                     string `yaml:"id,omitempty" json:"id"`
	Name                   string `yaml:"name,omitempty" json:"name"`
	Component              string `yaml:"component,omitempty" json:"component"`
	Category               string `yaml:"category,omitempty" json:"category"`
	AutoCompleteAddsQuotes bool   `yaml:"autoCompleteAddsQuotes,omitempty" json:"autoCompleteAddsQuotes"`
	Hint                   string `yaml:"hint,omitempty" json:"hint"`
	Examples               string `yaml:"examples,omitempty" json:"examples"`
	DocUrl                 string `yaml:"docUrl,omitempty" json:"docUrl"`
	Placeholder            string `yaml:"placeholder,omitempty" json:"placeholder"`
}

type frontendConfig struct {
	BuildVersion string   `yaml:"buildVersion" json:"buildVersion"`
	BuildDate    string   `yaml:"buildDate" json:"buildDate"`
	RecordTypes  []string `yaml:"recordTypes" json:"recordTypes"`
	PortNaming   struct {
		Enable    bool              `yaml:"enable,omitempty" json:"enable"`
		PortNames map[string]string `yaml:"portNames,omitempty" json:"portNames"`
	} `yaml:"portNaming,omitempty" json:"portNaming"`
	Columns         []Column      `yaml:"columns" json:"columns"`
	Filters         []Filter      `yaml:"filters" json:"filters"`
	QuickFilters    []QuickFilter `yaml:"quickFilters" json:"quickFilters"`
	AlertNamespaces []string      `yaml:"alertNamespaces" json:"alertNamespaces"`
	Sampling        int           `yaml:"sampling" json:"sampling"`
	Features        []string      `yaml:"features" json:"features"`
}

func readConfigFile(version, date, filename string) (*frontendConfig, error) {
	cfg := frontendConfig{
		BuildVersion: version,
		BuildDate:    date,
		RecordTypes:  []string{"flowLog"},
		Columns: []Column{
			{Id: "EndTime", Name: "End Time", Field: "TimeFlowEndMs", Default: true, Width: 15},
			{Id: "SrcAddr", Name: "IP", Group: "Source", Field: "SrcAddr", Default: true, Width: 15},
			{Id: "DstAddr", Name: "IP", Group: "Destination", Field: "DstAddr", Default: true, Width: 15},
		},
		Filters:      []Filter{},
		QuickFilters: []QuickFilter{},
		Features:     []string{},
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

func GetConfig(version, date, filename string) func(w http.ResponseWriter, r *http.Request) {
	resp, err := readConfigFile(version, date, filename)
	if err != nil {
		hlog.Errorf("Could not read config file: %v", err)
	}
	return func(w http.ResponseWriter, r *http.Request) {
		if err != nil {
			resp, err = readConfigFile(version, date, filename)
			if err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
			} else {
				writeJSON(w, http.StatusOK, resp)
			}
		} else {
			writeJSON(w, http.StatusOK, resp)
		}
	}
}
