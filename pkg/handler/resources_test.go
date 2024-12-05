package handler

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/httpclient/httpclienttest"
)

var h = Handlers{Cfg: &config.Config{Loki: config.Loki{
	URL:    "http://loki",
	Labels: []string{"_RecordType", "SrcK8S_Namespace", "DstK8S_Namespace", "SrcK8S_OwnerName", "DstK8S_OwnerName"},
}}}

const testLokiBaseURL = "http://loki/loki/api/v1/"

func TestGetSourceOwnerNames(t *testing.T) {
	lokiClientMock := new(httpclienttest.HTTPClientMock)
	lokiClientMock.SpyURL(func(url string) {
		assert.Equal(
			t,
			testLokiBaseURL+"query_range?query={app=\"netobserv-flowcollector\",_RecordType=\"flowLog\",SrcK8S_Namespace=\"default\"}|~`SrcK8S_OwnerType\":\"Deployment\"`",
			url,
		)
	})
	cl := clients{loki: lokiClientMock}
	_, _, _ = h.getNamesForPrefix(context.Background(), cl, "Src", "Deployment", "default")

	lokiClientMock.AssertNumberOfCalls(t, "Get", 1)
}

func TestGetDestPodNames(t *testing.T) {
	lokiClientMock := new(httpclienttest.HTTPClientMock)
	lokiClientMock.SpyURL(func(url string) {
		assert.Equal(
			t,
			testLokiBaseURL+"query_range?query={app=\"netobserv-flowcollector\",_RecordType=\"flowLog\",DstK8S_Namespace=\"default\"}|~`DstK8S_Type\":\"Pod\"`",
			url,
		)
	})
	cl := clients{loki: lokiClientMock}
	_, _, _ = h.getNamesForPrefix(context.Background(), cl, "Dst", "Pod", "default")

	lokiClientMock.AssertNumberOfCalls(t, "Get", 1)
}

func TestGetSourceNodeNames(t *testing.T) {
	lokiClientMock := new(httpclienttest.HTTPClientMock)
	lokiClientMock.SpyURL(func(url string) {
		assert.Equal(
			t,
			testLokiBaseURL+"query_range?query={app=\"netobserv-flowcollector\",_RecordType=\"flowLog\"}|~`SrcK8S_Type\":\"Node\"`",
			url,
		)
	})
	cl := clients{loki: lokiClientMock}
	_, _, _ = h.getNamesForPrefix(context.Background(), cl, "Src", "Node", "")

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
	cl := clients{loki: lokiClientMock}
	_, _, _ = h.getLabelValues(context.Background(), cl, "DstK8S_Namespace", false)

	lokiClientMock.AssertNumberOfCalls(t, "Get", 1)
}
