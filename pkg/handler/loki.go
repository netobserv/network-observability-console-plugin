package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/handler/lokiclientmock"
	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/metrics"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/filters"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

type LokiError struct {
	DisplayMessage string
	Message        string
}

type errorWithCode struct {
	err  error
	code int
}

var hlog = logrus.WithField("module", "handler")

const (
	lokiOrgIDHeader = "X-Scope-OrgID"
)

func newLokiClient(cfg *config.Loki, requestHeader http.Header, useStatusConfig bool) httpclient.Caller {
	headers := map[string][]string{}
	if cfg.TenantID != "" {
		headers[lokiOrgIDHeader] = []string{cfg.TenantID}
	}

	if cfg.ForwardUserToken {
		token := requestHeader.Get(auth.AuthHeader)
		if token != "" {
			headers[auth.AuthHeader] = []string{token}
		} else {
			hlog.Debug("Missing Authorization token in user request")
		}
	} else if cfg.TokenPath != "" {
		bytes, err := os.ReadFile(cfg.TokenPath)
		if err != nil {
			hlog.WithError(err).Fatalf("failed to parse authorization path: %s", cfg.TokenPath)
		}
		headers[auth.AuthHeader] = []string{"Bearer " + string(bytes)}
	}

	if cfg.UseMocks {
		hlog.Debug("Mocking Loki Client")
		return new(lokiclientmock.LokiClientMock)
	}

	skipTLS := cfg.SkipTLS
	caPath := cfg.CAPath
	userCertPath := ""
	userKeyPath := ""
	if useStatusConfig {
		skipTLS = cfg.StatusSkipTLS
		caPath = cfg.StatusCAPath
		userCertPath = cfg.StatusUserCertPath
		userKeyPath = cfg.StatusUserKeyPath
	}

	return httpclient.NewClientWrapper(cfg.Timeout.Duration, headers, skipTLS, caPath, userCertPath, userKeyPath)
}

/* loki query will fail if spaces or quotes are not encoded
 * we can't use url.QueryEscape or url.Values here since Loki doesn't manage encoded parenthesis
 */
func EncodeQuery(url string) string {
	unquoted := strings.ReplaceAll(url, "\"", "%22")
	unspaced := strings.ReplaceAll(unquoted, " ", "%20")
	return unspaced
}

func getLokiError(resp []byte, code int) (int, string) {
	var f map[string]string
	if code == http.StatusBadRequest {
		return code, fmt.Sprintf("Loki message: %s", resp)
	}
	if code == http.StatusForbidden {
		return code, fmt.Sprintf("Forbidden: %s", resp)
	}
	err := json.Unmarshal(resp, &f)
	if err != nil {
		hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
		return http.StatusBadRequest, fmt.Sprintf("Unknown error from Loki\ncannot unmarshal\n%s", resp)
	}
	message, ok := f["message"]
	if !ok {
		return http.StatusBadRequest, "Unknown error from Loki\nno message found"
	}
	return http.StatusBadRequest, fmt.Sprintf("Loki message: %s", message)
}

func fetchLogQL(logQL string, lokiClient httpclient.Caller) (model.QueryResponse, int, error) {
	var qr model.QueryResponse
	resp, code, err := executeLokiQuery(logQL, lokiClient)
	if err != nil {
		return qr, code, err
	}
	if err := json.Unmarshal(resp, &qr); err != nil {
		hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
		return qr, http.StatusInternalServerError, err
	}
	return qr, code, nil
}

func executeLokiQuery(flowsURL string, lokiClient httpclient.Caller) ([]byte, int, error) {
	hlog.Debugf("executeLokiQuery URL: %s", flowsURL)
	var code int
	startTime := time.Now()
	defer func() {
		metrics.ObserveLokiCall(code, startTime)
	}()

	resp, code, err := lokiClient.Get(flowsURL)
	if err != nil {
		return nil, http.StatusServiceUnavailable, err
	}
	if code != http.StatusOK {
		newCode, msg := getLokiError(resp, code)
		return nil, newCode, fmt.Errorf("[%d] %s", code, msg)
	}
	return resp, http.StatusOK, nil
}

func getLokiLabelValues(baseURL string, lokiClient httpclient.Caller, label string) ([]string, int, error) {
	baseURL = strings.TrimRight(baseURL, "/")
	url := fmt.Sprintf("%s/loki/api/v1/label/%s/values", baseURL, label)
	hlog.Debugf("getLokiLabelValues URL: %s", url)

	resp, code, err := lokiClient.Get(url)
	if err != nil {
		return nil, http.StatusServiceUnavailable, err
	}
	if code != http.StatusOK {
		newCode, msg := getLokiError(resp, code)
		return nil, newCode, errors.New(msg)
	}
	hlog.Tracef("getLokiLabelValues raw response: %s", resp)
	var lvr model.LabelValuesResponse
	err = json.Unmarshal(resp, &lvr)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	return lvr.Data, http.StatusOK, nil
}

func getLokiNamesForPrefix(cfg *config.Loki, lokiClient httpclient.Caller, prefix, kind, namespace string) ([]string, int, error) {
	lokiParams := filters.SingleQuery{}
	if namespace != "" {
		lokiParams = append(lokiParams, filters.NewMatch(prefix+fields.Namespace, exact(namespace)))
	}
	var fieldToExtract string
	if utils.IsOwnerKind(kind) {
		lokiParams = append(lokiParams, filters.NewMatch(prefix+fields.OwnerType, exact(kind)))
		fieldToExtract = prefix + fields.OwnerName
	} else {
		lokiParams = append(lokiParams, filters.NewMatch(prefix+fields.Type, exact(kind)))
		fieldToExtract = prefix + fields.Name
	}

	queryBuilder := loki.NewFlowQueryBuilderWithDefaults(cfg)
	if err := queryBuilder.Filters(lokiParams); err != nil {
		return nil, http.StatusBadRequest, err
	}

	query := queryBuilder.Build()
	resp, code, err := executeLokiQuery(query, lokiClient)
	if err != nil {
		return nil, code, errors.New("Loki query failed: " + err.Error())
	}
	hlog.Tracef("GetNames raw response: %s", resp)

	var qr model.QueryResponse
	err = json.Unmarshal(resp, &qr)
	if err != nil {
		hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
		return nil, http.StatusInternalServerError, errors.New("Failed to unmarshal Loki response: " + err.Error())
	}

	streams, ok := qr.Data.Result.(model.Streams)
	if !ok {
		return nil, http.StatusInternalServerError, errors.New("Loki returned unexpected type: " + string(qr.Data.ResultType))
	}

	values := extractDistinctValues(fieldToExtract, streams)
	return values, http.StatusOK, nil
}

func (h *Handlers) LokiReady() func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.Cfg.IsLokiEnabled() {
			writeError(w, http.StatusBadRequest, "Loki is disabled")
			return
		}
		lokiClient := newLokiClient(&h.Cfg.Loki, r.Header, true)
		baseURL := strings.TrimRight(h.Cfg.Loki.GetStatusURL(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "ready"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		status := string(resp)
		if strings.Contains(status, "ready") {
			code = http.StatusOK
			writeText(w, code, resp)
			return
		}

		writeError(w, code, fmt.Sprintf("Loki returned a non ready status: %s", status))
	}
}

func (h *Handlers) LokiMetrics() func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.Cfg.IsLokiEnabled() {
			writeError(w, http.StatusBadRequest, "Loki is disabled")
			return
		}
		lokiClient := newLokiClient(&h.Cfg.Loki, r.Header, true)
		baseURL := strings.TrimRight(h.Cfg.Loki.GetStatusURL(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "metrics"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		writeText(w, code, resp)
	}
}

func (h *Handlers) LokiBuildInfos() func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.Cfg.IsLokiEnabled() {
			writeError(w, http.StatusBadRequest, "Loki is disabled")
			return
		}
		lokiClient := newLokiClient(&h.Cfg.Loki, r.Header, true)
		baseURL := strings.TrimRight(h.Cfg.Loki.GetStatusURL(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "loki/api/v1/status/buildinfo"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		writeText(w, code, resp)
	}
}

func (h *Handlers) LokiConfig(param string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.Cfg.IsLokiEnabled() {
			writeError(w, http.StatusBadRequest, "Loki is disabled")
			return
		}
		lokiClient := newLokiClient(&h.Cfg.Loki, r.Header, true)
		baseURL := strings.TrimRight(h.Cfg.Loki.GetStatusURL(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "config"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		cfg := make(map[string]interface{})
		err = yaml.Unmarshal(resp, &cfg)
		if err != nil {
			hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
			writeError(w, code, err.Error())
			return
		}
		writeJSON(w, code, cfg[param])
	}
}

func (h *Handlers) IngesterMaxChunkAge() func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.Cfg.IsLokiEnabled() {
			writeError(w, http.StatusBadRequest, "Loki is disabled")
			return
		}
		lokiClient := newLokiClient(&h.Cfg.Loki, r.Header, true)
		baseURL := strings.TrimRight(h.Cfg.Loki.GetStatusURL(), "/")

		resp, code, err := executeLokiQuery(fmt.Sprintf("%s/%s", baseURL, "config"), lokiClient)
		if err != nil {
			writeError(w, code, err.Error())
			return
		}

		cfg := make(map[string]interface{})
		err = yaml.Unmarshal(resp, &cfg)
		if err != nil {
			hlog.WithError(err).Errorf("cannot unmarshal, response was: %v", string(resp))
			writeError(w, code, err.Error())
			return
		}

		// default max chunk age is 2h
		// see https://grafana.com/docs/loki/latest/configure/#ingester
		var maxChunkAge interface{} = "2h"
		if cfg["ingester"] != nil {
			ingester := cfg["ingester"].(map[string]interface{})
			if ingester["max_chunk_age"] != nil {
				maxChunkAge = ingester["max_chunk_age"]
			}
		}

		writeJSON(w, code, maxChunkAge)
	}
}
