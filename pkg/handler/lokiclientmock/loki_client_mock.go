package lokiclientmock

import (
	"io/ioutil"
	"strings"
)

type LokiClientMock struct {
}

func (o *LokiClientMock) Get(url string) ([]byte, int, error) {
	var path string

	isLabel := strings.Contains(url, "/label/")
	if isLabel {
		path = "mocks/loki/namespaces.json"
	} else {
		isTopology := strings.Contains(url, "query=topk")
		if isTopology {
			if strings.Contains(url, "scope=app") {
				path = "mocks/loki/topology_app.json"
			} else if strings.Contains(url, "scope=host") {
				path = "mocks/loki/topology_host.json"
			} else if strings.Contains(url, "scope=namespace") {
				path = "mocks/loki/topology_namespace.json"
			} else if strings.Contains(url, "scope=owner") {
				path = "mocks/loki/topology_owner.json"
			} else {
				path = "mocks/loki/topology_resource.json"
			}
		} else {
			path = "mocks/loki/flows.json"
		}
	}

	file, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, 500, err
	}

	return []byte(file), 200, nil
}
