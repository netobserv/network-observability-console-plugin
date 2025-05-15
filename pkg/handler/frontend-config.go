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
	return func(w http.ResponseWriter, r *http.Request) {
		if err != nil {
			cfg, err = config.ReadFile(h.Cfg.Frontend.BuildVersion, h.Cfg.Frontend.BuildDate, h.Cfg.Path)
			if err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
			}
		}
		if h.Cfg.IsLokiEnabled() {
			// (Re)load Loki max chunk age
			lokiClient := NewLokiClient(&h.Cfg.Loki, r.Header, true)
			if maxChunkAge, err := h.fetchIngesterMaxChunkAge(lokiClient); err != nil {
				// Log the error, but keep returning known config
				hlog.Errorf("Could not get max chunk age: %v", err)
			} else {
				cfg.Frontend.MaxChunkAgeMs = int(maxChunkAge.Milliseconds())
			}
		}
		writeJSON(w, http.StatusOK, cfg.Frontend)
	}
}
