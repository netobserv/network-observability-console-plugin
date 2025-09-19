package alertingmock

import (
	"encoding/json"
	"fmt"
	"math/rand/v2"
	"net/http"
	"net/url"
	"strings"

	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
)

var mlog = logrus.WithField("module", "alertingmock")

var namespaces = []string{"uss-enterprise", "uss-raven", "la-sirena", "sh-raan", "the-whale-probe", "uss-defiant", "scimitar", "romulan-warbird", "uss-excelsior", "galileo", "phoenix"}
var nodes = []string{"caldonia", "denobula", "vulcan"}

// We duplicate prom model due to missing json information
type AlertingRule struct {
	Name        string         `json:"name"`
	Labels      model.LabelSet `json:"labels"`
	Annotations model.LabelSet `json:"annotations"`
	Alerts      []*Alert       `json:"alerts"`
	State       string         `json:"state"`
}

type Alert struct {
	Annotations model.LabelSet `json:"annotations"`
	Labels      model.LabelSet `json:"labels"`
	State       string         `json:"state"`
	Value       string         `json:"value"`
}

const (
	firing   int = 0x01
	pending  int = 0x02
	silenced int = 0x04
)

func stateToString(state int) string {
	if state&firing > 0 {
		return "firing"
	}
	if state&pending > 0 {
		return "pending"
	}
	if state&silenced > 0 {
		return "silenced"
	}
	return "inactive"
}

func randomState() int {
	rndState := rand.IntN(10)
	if rndState < 1 {
		return silenced
	} else if rndState < 3 {
		return pending
	}
	return firing
}

func createAlert(probability float64, name, resourceName string, threshold, upperBound int, targetLabels, resourceNames []string, annotations, labels model.LabelSet) (*Alert, int) {
	if rand.Float64() < probability {
		alertLabels := labels.Clone()
		alertState := randomState()
		alertLabels["alertname"] = model.LabelValue(name)
		for i, lbl := range targetLabels {
			// First label will be "resourceName"; next are picked randomly
			if i == 0 {
				alertLabels[model.LabelName(lbl)] = model.LabelValue(resourceName)
			} else {
				idx := rand.IntN(len(resourceNames))
				alertLabels[model.LabelName(lbl)] = model.LabelValue(resourceNames[idx])
			}
		}
		val := float64(threshold) + rand.Float64()*float64(upperBound-threshold)
		return &Alert{
			Annotations: annotations,
			Labels:      alertLabels,
			State:       stateToString(alertState),
			Value:       fmt.Sprintf("%f", val),
		}, alertState
	}
	return nil, 0
}

func createAlerts(probability float64, name string, threshold, upperBound int, targetLabels, resourceNames []string, annotations, labels model.LabelSet) ([]*Alert, int) {
	alerts := []*Alert{}
	var ruleState int
	for _, resourceName := range resourceNames {
		if alert, state := createAlert(probability, name, resourceName, threshold, upperBound, targetLabels, resourceNames, annotations, labels); alert != nil {
			ruleState |= state
			alerts = append(alerts, alert)
		}
	}
	return alerts, ruleState
}

func createRule(probability float64, name, severity, extraFilter string, threshold, upperBound int, bynetobs bool, nsLbl, nodeLbl []string) AlertingRule {
	labels := model.LabelSet{
		"severity": model.LabelValue(severity),
	}
	annotations := model.LabelSet{
		"description": model.LabelValue(name + " (a complete description...)"),
		"summary":     model.LabelValue(name + " (a summary...)"),
	}
	if bynetobs {
		labels["app"] = "netobserv"
	}
	labels["netobserv"] = "true"
	var jsonNsLbl, jsonNodeLbl string
	if len(nsLbl) > 0 {
		var quotedLbl []string
		for _, lbl := range nsLbl {
			quotedLbl = append(quotedLbl, `"`+lbl+`"`)
		}
		jsonNsLbl = fmt.Sprintf(`"namespaceLabels":[%s],`, strings.Join(quotedLbl, ","))
	}
	if len(nodeLbl) > 0 {
		var quotedLbl []string
		for _, lbl := range nodeLbl {
			quotedLbl = append(quotedLbl, `"`+lbl+`"`)
		}
		jsonNodeLbl = fmt.Sprintf(`"nodeLabels":[%s],`, strings.Join(quotedLbl, ","))
	}
	searchURL := "https://duckduckgo.com/?q=" + url.PathEscape(name)
	var extraFilterJSON string
	if extraFilter != "" {
		extraFilterJSON = fmt.Sprintf(`,"trafficLinkFilter":"%s"`, extraFilter)
	}
	annotations["netobserv_io_network_health"] = model.LabelValue(fmt.Sprintf(
		`{%s%s"threshold":"%d","upperBound":"%d","unit":"%%","links":[{"name":"Search the web", "url": "%s"}]%s}`,
		jsonNsLbl,
		jsonNodeLbl,
		threshold,
		upperBound,
		searchURL,
		extraFilterJSON,
	))
	ruleLabels := labels.Clone()
	ruleLabels["prometheus"] = "openshift-monitoring/k8s"
	var alerts []*Alert
	var ruleState int
	if len(nsLbl) > 0 {
		alerts, ruleState = createAlerts(probability, name, threshold, upperBound, nsLbl, namespaces, annotations, labels)
	} else if len(nodeLbl) > 0 {
		alerts, ruleState = createAlerts(probability, name, threshold, upperBound, nodeLbl, nodes, annotations, labels)
	} else {
		// global
		alerts = []*Alert{}
		if alert, state := createAlert(probability, name, "", threshold, upperBound, nil, nil, annotations, labels); alert != nil {
			ruleState |= state
			alerts = append(alerts, alert)
		}
	}
	return AlertingRule{
		Name:        name,
		Annotations: annotations,
		Labels:      labels,
		State:       stateToString(ruleState),
		Alerts:      alerts,
	}
}

func GetRules() func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, _ *http.Request) {
		alertingRules := []AlertingRule{
			createRule(0.4, "Packet delivery failed", "info", "", 5, 100, true, []string{"SrcK8S_Namespace", "DstK8S_Namespace"}, []string{}),
			createRule(0.3, "You have reached your hourly rate limit", "info", "", 5, 100, true, []string{"SrcK8S_Namespace", "DstK8S_Namespace"}, []string{}),
			createRule(0.1, "It's always DNS", "warning", `dns_flag_response_code!=\"\"`, 15, 100, true, []string{"SrcK8S_Namespace", "DstK8S_Namespace"}, []string{}),
			createRule(0.1, "We're under attack", "warning", "", 20, 100, true, []string{}, []string{}),
			createRule(0.1, "Sh*t - Famous last words", "critical", "", 5, 100, true, []string{}, []string{"SrcK8S_Hostname", "DstK8S_Hostname"}),
			createRule(0.3, "FromIngress", "info", "", 10, 100, false, []string{"exported_namespace"}, []string{}),
			createRule(0.3, "Degraded latency", "info", "", 100, 1000, true, []string{"SrcK8S_Namespace", "DstK8S_Namespace"}, []string{}),
		}
		res := map[string]any{
			"status": "success",
			"data": map[string]any{
				"groups": []map[string]any{
					{
						"name":     "group-name",
						"file":     "file",
						"interval": 30,
						"rules":    alertingRules,
					},
				},
			},
		}

		response, err := json.Marshal(res)
		if err != nil {
			mlog.Errorf("Marshalling error while responding JSON: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			if _, err = w.Write([]byte(err.Error())); err != nil {
				mlog.Errorf("Error while responding error: %v", err)
			}
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if _, err = w.Write(response); err != nil {
			mlog.Errorf("Error while responding JSON: %v", err)
		}
	}
}
