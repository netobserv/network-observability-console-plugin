package decoders

import (
	"encoding/json"

	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	ovnmodel "github.com/ovn-org/ovn-kubernetes/go-controller/observability-lib/model"
	"github.com/sirupsen/logrus"
)

var dlog = logrus.WithField("module", "decoders")

func NetworkEventsToString(in string) string {
	line := make(map[string]any)
	if err := json.Unmarshal([]byte(in), &line); err != nil {
		dlog.Errorf("Could not decode NetworkEvent: %v", err)
		return in
	}
	if ne, found := line[fields.NetworkEvents]; found {
		if neList, isList := ne.([]any); isList {
			var messages []string
			for _, item := range neList {
				if neItem, isMap := item.(map[string]any); isMap {
					messages = append(messages, networkEventItemToString(neItem))
				}
			}
			line[fields.NetworkEvents] = messages
			b, err := json.Marshal(line)
			if err != nil {
				dlog.Errorf("Could not reencode NetworkEvent: %v", err)
				return in
			}
			return string(b)
		}
	}
	return in
}

func networkEventItemToString(in map[string]any) string {
	if msg := getAsString(in, "Message"); msg != "" {
		return msg
	}
	if feat := getAsString(in, "Feature"); feat == "acl" {
		aclObj := ovnmodel.ACLEvent{
			Action:    getAsString(in, "Action"),
			Actor:     getAsString(in, "Type"),
			Name:      getAsString(in, "Name"),
			Namespace: getAsString(in, "Namespace"),
			Direction: getAsString(in, "Direction"),
		}
		return aclObj.String()
	}
	return ""
}

func getAsString(in map[string]any, key string) string {
	if anyV, hasKey := in[key]; hasKey {
		if v, isStr := anyV.(string); isStr {
			return v
		}
	}
	return ""
}
