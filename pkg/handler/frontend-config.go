package handler

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

	"gopkg.in/yaml.v3"
)

type frontendConfig struct {
	PortNaming struct {
		Enable    bool              `yaml:"Enable,omitempty" json:"Enable,omitempty"`
		PortNames map[string]string `yaml:"portNames,omitempty" json:"portNames,omitempty"`
	} `yaml:"portNaming,omitempty" json:"portNaming,omitempty"`
}

func readConfigFile(FrontendConfig string) ([]byte, error) {
	resp := []byte{}
	cfg := frontendConfig{}
	yamlFile, err := ioutil.ReadFile(FrontendConfig)
	if err == nil {
		err = yaml.Unmarshal(yamlFile, &cfg)
		if err == nil {
			resp, err = json.Marshal(cfg)
		}
	}
	return resp, err
}

func GetConfig(FrontendConfig string) func(w http.ResponseWriter, r *http.Request) {

	resp, err := readConfigFile(FrontendConfig)
	return func(w http.ResponseWriter, r *http.Request) {
		if err != nil {
			resp, err = readConfigFile(FrontendConfig)
			if err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
			} else {
				writeRawJSON(w, http.StatusOK, resp)
			}
		} else {
			writeRawJSON(w, http.StatusOK, resp)
		}
	}
}
