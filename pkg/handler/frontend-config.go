package handler

import (
	"net/http"
	"os"

	"gopkg.in/yaml.v3"
)

type QuickFilter struct {
	Name    string            `yaml:"name,omitempty" json:"name"`
	Filter  map[string]string `yaml:"filter,omitempty" json:"filter"`
	Default bool              `yaml:"default,omitempty" json:"default"`
}

type frontendConfig struct {
	BuildVersion string   `yaml:"buildVersion" json:"buildVersion"`
	BuildDate    string   `yaml:"buildDate" json:"buildDate"`
	RecordTypes  []string `yaml:"recordTypes" json:"recordTypes"`
	PortNaming   struct {
		Enable    bool              `yaml:"enable,omitempty" json:"enable"`
		PortNames map[string]string `yaml:"portNames,omitempty" json:"portNames"`
	} `yaml:"portNaming,omitempty" json:"portNaming"`
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
