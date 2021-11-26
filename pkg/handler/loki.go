package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient"
)

var hlog = logrus.WithField("module", "handler")

func GetFlows(w http.ResponseWriter, r *http.Request) {
	// TODO: loki with auth
	// TODO: not hardcoded URL (program argument)
	resp, code, err := httpclient.HTTPGet(`http://localhost:3100/loki/api/v1/query_range?query={app="netobserv-flowcollector"}`, 10*time.Second)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}
	if code != http.StatusOK {
		msg := getLokiError(resp, code)
		writeError(w, http.StatusServiceUnavailable, msg)
		return
	}
	hlog.Infof("GetFlows raw response: %v", string(resp)) // TODO: remove logs
	writeRawJSON(w, http.StatusOK, resp)
	// var streamResponse model.LokiStreamResponse
	// err = json.Unmarshal(resp, &streamResponse)
	// _, err := w.Write([]byte(""))
	// if err != nil {
	// 	logrus.Errorf("could not write response: %v", err)
	// }
}

func getLokiError(resp []byte, code int) string {
	var f map[string]string
	err := json.Unmarshal(resp, &f)
	if err != nil {
		return fmt.Sprintf("Unknown error from Loki - cannot unmarshal (code: %d)", code)
	}
	message, ok := f["message"]
	if !ok {
		return fmt.Sprintf("Unknown error from Loki - no message found (code: %d)", code)
	}
	return fmt.Sprintf("Error from Loki (code: %d): %s", code, message)
}

func writeJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		hlog.Errorf("Marshalling error while responding JSON: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err = w.Write(response)
	if err != nil {
		hlog.Errorf("Error while responding JSON: %v", err)
	}
}

func writeRawJSON(w http.ResponseWriter, code int, payload []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err := w.Write(payload)
	if err != nil {
		hlog.Errorf("Error while responding raw JSON: %v", err)
	}
}

type errorResponse struct{ Message string }

func writeError(w http.ResponseWriter, code int, message string) {
	response, err := json.Marshal(errorResponse{Message: message})
	if err != nil {
		hlog.Errorf("Marshalling error while responding an error: %v (message was: %s)", err, message)
		code = http.StatusInternalServerError
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err = w.Write(response)
	if err != nil {
		hlog.Errorf("Error while responding an error: %v (message was: %s)", err, message)
	}
}
