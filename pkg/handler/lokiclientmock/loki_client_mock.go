package lokiclientmock

import (
	"encoding/json"
	"os"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/decoders"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/sirupsen/logrus"
)

var mlog = logrus.WithField("module", "lokiclientmock")

type LokiClientMock struct {
}

//nolint:cyclop
func (o *LokiClientMock) Get(url string) ([]byte, int, error) {
	var path string
	parseNetEvents := false
	mlog.Debugf("Get url: %s", url)


	isLabel := strings.Contains(url, "/label/")
	if isLabel {
		path = "mocks/loki/namespaces.json"
	} else {
		if strings.Contains(url, "query=topk") || strings.Contains(url, "query=bottomk") {
			path = "mocks/loki/flow_metrics"

			if strings.Contains(url, "|unwrap%20PktDrop") {
				path += "_dropped"
			}

			//nolint:gocritic // if-else is ok
			if strings.Contains(url, "by(app)") {
				path += "_app.json"
			} else if strings.Contains(url, "by(PktDropLatestState)") {
				path += "_state.json"
			} else if strings.Contains(url, "by(PktDropLatestDropCause)") {
				path += "_cause.json"
			} else if strings.Contains(url, "by(K8S_ClusterName)") {
				path += "_cluster.json"
			} else if strings.Contains(url, "by(UdnId)") {
				path += "_udn.json"
			} else if strings.Contains(url, "by(SrcK8S_Zone,DstK8S_Zone)") {
				path += "_zone.json"
			} else if strings.Contains(url, "by(SrcK8S_HostName,DstK8S_HostName)") {
				path += "_host.json"
			} else if strings.Contains(url, "by(SrcK8S_Namespace,DstK8S_Namespace)") {
				path += "_namespace.json"
			} else if strings.Contains(url, "by(SrcK8S_OwnerName,SrcK8S_OwnerType,DstK8S_OwnerName,DstK8S_OwnerType,SrcK8S_Namespace,DstK8S_Namespace)") {
				path += "_owner.json"
			} else {
				path += "_resource.json"
			}
		} else {
			path = "mocks/loki/flow_records"
			//nolint:gocritic // if-else is ok
			if strings.Contains(url, "|~`\"Packets\":0[,}]|~`\"PktDropPackets\":[1-9][0-9]*[,}]") {
				path += "_dropped.json"
			} else if strings.Contains(url, "|~`\"PktDropPackets\":[1-9][0-9]*[,}]") {
				path += "_has_dropped.json"
			} else if strings.Contains(url, "|~`\"PktDropPackets\":0[,}]") {
				path += "_sent.json"
			} else {
				path += ".json"
				parseNetEvents = true
			}
		}
	}

	mlog.Debugf("Reading file path: %s", path)
	file, err := os.ReadFile(path)
	mlog.Debugf("here")
	if err != nil {
		// return nil, 500, err
		emptyResponse := []byte(`{
			"status": "success",
			"data": {
				"resultType": "matrix",
				"result": []
			}
		}`)

		var qr model.QueryResponse
		err = json.Unmarshal(emptyResponse, &qr)
		if err != nil {
			return nil, 500, err
		}
		for _, s := range qr.Data.Result.(model.Streams) {
			for i := range s.Entries {
				s.Entries[i].Line = decoders.NetworkEventsToString(s.Entries[i].Line)
			}
		}
		emptyResponse, err = json.Marshal(qr)
		if err != nil {
			return nil, 500, err
		}
		return emptyResponse, 200, nil
	}

	if parseNetEvents {
		var qr model.QueryResponse
		err = json.Unmarshal(file, &qr)
		if err != nil {
			return nil, 500, err
		}
		for _, s := range qr.Data.Result.(model.Streams) {
			for i := range s.Entries {
				s.Entries[i].Line = decoders.NetworkEventsToString(s.Entries[i].Line)
			}
		}
		file, err = json.Marshal(qr)
		if err != nil {
			return nil, 500, err
		}
	}

	return []byte(file), 200, nil
}
