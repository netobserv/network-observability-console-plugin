package handler

import (
	"net/http"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
)

func (h *Handlers) GetFrontendConfig() func(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.ReadFile(h.Cfg.Frontend.BuildVersion, h.Cfg.Frontend.BuildDate, h.Cfg.Path)
	if err != nil {
		hlog.Errorf("Could not read config file: %v", err)
	}
	return func(w http.ResponseWriter, _ *http.Request) {
		if err != nil {
			cfg, err = config.ReadFile(h.Cfg.Frontend.BuildVersion, h.Cfg.Frontend.BuildDate, h.Cfg.Path)
			if err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
			} else {
				writeJSON(w, http.StatusOK, cfg.Frontend)
			}
		} else {
			writeJSON(w, http.StatusOK, cfg.Frontend)
		}
	}
}
