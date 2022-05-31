package httpclienttest

import (
	"io/ioutil"
	"strings"
)

type HTTPClientJSONMock struct {
}

func (o *HTTPClientJSONMock) Get(url string) ([]byte, int, error) {
	var path string

	isLabel := strings.Contains(url, "/label/")
	if isLabel {
		path = "mocks/loki/namespaces.json"
	} else {
		isTopology := strings.Contains(url, "query=topk")
		if isTopology {
			path = "mocks/loki/topology.json"
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
