package handler

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient/httpclienttest"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
)

var testLokiConfig = loki.Config{
	URL: &url.URL{Scheme: "http", Host: "loki"},
	Labels: map[string]struct{}{
		"SrcK8S_Namespace": {},
		"DstK8S_Namespace": {},
		"SrcK8S_OwnerName": {},
		"DstK8S_OwnerName": {},
	},
}

const testLokiBaseURL = "http://loki/loki/api/v1/"

func TestGetSourceOwnerNames(t *testing.T) {
	lokiClientMock := new(httpclienttest.HTTPClientMock)
	lokiClientMock.SpyURL(func(url string) {
		assert.Equal(
			t,
			testLokiBaseURL+"query_range?query={app=\"netobserv-flowcollector\",SrcK8S_Namespace=\"default\"}|~`SrcK8S_OwnerType\":\"Deployment\"`",
			url,
		)
	})
	_, _, _ = getNamesForPrefix(&testLokiConfig, lokiClientMock, "Src", "Deployment", "default")

	lokiClientMock.AssertNumberOfCalls(t, "Get", 1)
}

func TestGetDestPodNames(t *testing.T) {
	lokiClientMock := new(httpclienttest.HTTPClientMock)
	lokiClientMock.SpyURL(func(url string) {
		assert.Equal(
			t,
			testLokiBaseURL+"query_range?query={app=\"netobserv-flowcollector\",DstK8S_Namespace=\"default\"}|~`DstK8S_Type\":\"Pod\"`",
			url,
		)
	})
	_, _, _ = getNamesForPrefix(&testLokiConfig, lokiClientMock, "Dst", "Pod", "default")

	lokiClientMock.AssertNumberOfCalls(t, "Get", 1)
}

func TestGetSourceNodeNames(t *testing.T) {
	lokiClientMock := new(httpclienttest.HTTPClientMock)
	lokiClientMock.SpyURL(func(url string) {
		assert.Equal(
			t,
			testLokiBaseURL+"query_range?query={app=\"netobserv-flowcollector\"}|~`SrcK8S_Type\":\"Node\"`",
			url,
		)
	})
	_, _, _ = getNamesForPrefix(&testLokiConfig, lokiClientMock, "Src", "Node", "")

	lokiClientMock.AssertNumberOfCalls(t, "Get", 1)
}

func TestGetLabelValues(t *testing.T) {
	lokiClientMock := new(httpclienttest.HTTPClientMock)
	lokiClientMock.SpyURL(func(url string) {
		assert.Equal(
			t,
			testLokiBaseURL+"label/DstK8S_Namespace/values",
			url,
		)
	})
	_, _, _ = getLabelValues(&testLokiConfig, lokiClientMock, "DstK8S_Namespace")

	lokiClientMock.AssertNumberOfCalls(t, "Get", 1)
}
