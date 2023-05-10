package lokiclientmock

import (
	"os"
	"strings"

	"github.com/sirupsen/logrus"
)

var mlog = logrus.WithField("module", "lokiclientmock")

type LokiClientMock struct {
}

func (o *LokiClientMock) Get(url string) ([]byte, int, error) {
	var path string
	mlog.Debugf("Get url: %s", url)

	isLabel := strings.Contains(url, "/label/")
	if isLabel {
		path = "mocks/loki/namespaces.json"
	} else {
		if strings.Contains(url, "query=topk") {
			path = "mocks/loki/topology"

			if strings.Contains(url, "|unwrap%20TcpDrop") {
				path += "_dropped"
			}

			if strings.Contains(url, "by(app)") {
				path += "_app.json"
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
			path = "mocks/loki/flows"
			if strings.Contains(url, "|~`Packets\":0[,}]|~`TcpDropPackets\":[1-9]*[,}]") {
				path += "_dropped.json"
			} else if strings.Contains(url, "|~`TcpDropPackets\":[1-9]*[,}]") {
				path += "_has_dropped.json"
			} else if strings.Contains(url, "|~`Packets\":[1-9]*[,}]") {
				path += "_sent.json"
			} else {
				path += ".json"
			}
		}
	}

	mlog.Debugf("Reading file path: %s", path)
	file, err := os.ReadFile(path)
	if err != nil {
		return nil, 500, err
	}

	return []byte(file), 200, nil
}
