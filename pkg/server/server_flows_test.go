package server

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"regexp"
	"strconv"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

var timeNowArg = regexp.MustCompile(`\${timeNow-(\d+)}`)

func TestLokiFiltering(t *testing.T) {
	testCases := []struct {
		inputPath string
		// Either outputQueries or outputQueryParts should be defined
		// Use outputQueries when multiple queries are expected (parallel queries for match any)
		// Use outputQueryParts when single query is expected but the filters order isn't predictable
		outputQueries    []string
		outputQueryParts []string
	}{{
		inputPath: "?filters=SrcK8S_Name=test-pod",
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`SrcK8S_Name\":\"(?i)[^\"]*test-pod.*\"`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("Proto=6&SrcK8S_Name=test"),
		outputQueryParts: []string{
			"?query={app=\"netobserv-flowcollector\"}",
			"|~`Proto\":6[,}]`",
			"|~`SrcK8S_Name\":\"(?i)[^\"]*test.*\"`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("Proto=6|SrcK8S_Name=test"),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`Proto\":6[,}]`",
			"?query={app=\"netobserv-flowcollector\"}|~`SrcK8S_Name\":\"(?i)[^\"]*test.*\"`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcK8S_Namespace=test-namespace"),
		outputQueries: []string{
			`?query={app="netobserv-flowcollector",SrcK8S_Namespace=~"(?i).*test-namespace.*"}`,
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcK8S_Name=name1,name2"),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`SrcK8S_Name\":\"(?i)[^\"]*name1.*\"|SrcK8S_Name\":\"(?i)[^\"]*name2.*\"`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcK8S_Namespace=ns1,ns2"),
		outputQueries: []string{
			`?query={app="netobserv-flowcollector",SrcK8S_Namespace=~"(?i).*ns1.*|(?i).*ns2.*"}`,
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcPort=8080&SrcAddr=10.128.0.1&SrcK8S_Namespace=default") + "&dedup=true",
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\",SrcK8S_Namespace=~\"(?i).*default.*\"}|~`Duplicate\":false`|~`SrcPort\":8080[,}]`|json|SrcAddr=ip(\"10.128.0.1\")",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcAddr=10.128.0.1&DstAddr=10.128.0.2") + "&dedup=true",
		outputQueryParts: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`Duplicate\":false`|json",
			"|SrcAddr=ip(\"10.128.0.1\")",
			"|DstAddr=ip(\"10.128.0.2\")",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcAddr=10.128.0.1,10.128.0.2"),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|json|SrcAddr=ip(\"10.128.0.1\")+or+SrcAddr=ip(\"10.128.0.2\")",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcPort=8080|SrcAddr=10.128.0.1|SrcK8S_Namespace=default"),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\",SrcK8S_Namespace=~\"(?i).*default.*\"}",
			"?query={app=\"netobserv-flowcollector\"}|json|SrcAddr=ip(\"10.128.0.1\")",
			"?query={app=\"netobserv-flowcollector\"}|~`SrcPort\":8080[,}]`",
		},
	}, {
		inputPath:     "?startTime=1640991600",
		outputQueries: []string{`?query={app="netobserv-flowcollector"}&start=1640991600`},
	}, {
		inputPath:     "?endTime=1641160800",
		outputQueries: []string{`?query={app="netobserv-flowcollector"}&end=1641160801`},
	}, {
		inputPath:     "?startTime=1640991600&endTime=1641160800",
		outputQueries: []string{`?query={app="netobserv-flowcollector"}&start=1640991600&end=1641160801`},
	}, {
		inputPath:     "?timeRange=300000",
		outputQueries: []string{`?query={app="netobserv-flowcollector"}&start=${timeNow-300000}`},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcK8S_Namespace=\"exact-namespace\""),
		outputQueries: []string{
			`?query={app="netobserv-flowcollector",SrcK8S_Namespace="exact-namespace"}`,
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("SrcK8S_Name=\"exact-pod\""),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`SrcK8S_Name\":\"exact-pod\"`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("Port=8080&K8S_Name=test"),
		outputQueryParts: []string{
			"?query={app=\"netobserv-flowcollector\"}",
			"|~`Port\":8080[,}]`",
			"|~`K8S_Name\":\"(?i)[^\"]*test.*\"`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("Port=8080|K8S_Name=test"),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`K8S_Name\":\"(?i)[^\"]*test.*\"`",
			"?query={app=\"netobserv-flowcollector\"}|~`Port\":8080[,}]`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("Port=8080&SrcK8S_Namespace=test|Port=8080&DstK8S_Namespace=test"),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\",SrcK8S_Namespace=~\"(?i).*test.*\"}|~`Port\":8080[,}]`",
			"?query={app=\"netobserv-flowcollector\",DstK8S_Namespace=~\"(?i).*test.*\"}|~`Port\":8080[,}]`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape("Port=8080|SrcK8S_Namespace=test|DstK8S_Namespace=test"),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\",SrcK8S_Namespace=~\"(?i).*test.*\"}",
			"?query={app=\"netobserv-flowcollector\",DstK8S_Namespace=~\"(?i).*test.*\"}",
			"?query={app=\"netobserv-flowcollector\"}|~`Port\":8080[,}]`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcK8S_Namespace=""&DstPort=70`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\",SrcK8S_Namespace=\"\"}|~`DstPort\":70[,}]`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcK8S_Name=""&DstPort=70`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`DstPort\":70[,}]`|json|SrcK8S_Name=\"\"",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcK8S_Name="",foo&DstK8S_Name="hello"`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`DstK8S_Name\":\"hello\"`|json|SrcK8S_Name=\"\"+or+SrcK8S_Name=~`(?i).*foo.*`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcK8S_Namespace=""|DstPort=70`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\",SrcK8S_Namespace=\"\"}",
			"?query={app=\"netobserv-flowcollector\"}|~`DstPort\":70[,}]`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcK8S_Name=""|DstPort=70`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`DstPort\":70[,}]`",
			"?query={app=\"netobserv-flowcollector\"}|json|SrcK8S_Name=\"\"",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcK8S_Name="",foo|DstK8S_Name="hello"`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`DstK8S_Name\":\"hello\"`",
			"?query={app=\"netobserv-flowcollector\"}|json|SrcK8S_Name=\"\"+or+SrcK8S_Name=~`(?i).*foo.*`",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcK8S_Type="","Pod"`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|json|SrcK8S_Type=\"\"+or+SrcK8S_Type=\"Pod\"",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcAddr=""|DstAddr=""`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|json|DstAddr=\"\"",
			"?query={app=\"netobserv-flowcollector\"}|json|SrcAddr=\"\"",
		},
	}, {
		inputPath: "?filters=" + url.QueryEscape(`SrcPort=""`),
		outputQueries: []string{
			"?query={app=\"netobserv-flowcollector\"}|json|SrcPort=\"\"",
		},
	}}

	numberQueriesExpected := 0
	for _, tc := range testCases {
		if len(tc.outputQueries) > 0 {
			numberQueriesExpected += len(tc.outputQueries)
		} else {
			numberQueriesExpected++
		}
	}

	// GIVEN a Loki service
	lokiMock := httpMock{}
	authM := authMock{}
	authM.MockGranted()
	emptyResponse, _ := json.Marshal(model.QueryResponse{
		Status: "",
		Data: model.QueryResponseData{
			ResultType: model.ResultTypeStream,
			Result:     model.Streams{},
		},
	})
	lokiMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		_, _ = args.Get(0).(http.ResponseWriter).Write(emptyResponse)
	}).Times(numberQueriesExpected)
	lokiSvc := httptest.NewServer(&lokiMock)
	defer lokiSvc.Close()
	lokiURL, err := url.Parse(lokiSvc.URL)
	require.NoError(t, err)

	// THAT is accessed behind the NOO console plugin backend
	backendRoutes := setupRoutes(&Config{
		Loki: loki.NewConfig(
			lokiURL,
			lokiURL,
			time.Second,
			"",
			"",
			false,
			false,
			"",
			false,
			"",
			"",
			"",
			false,
			[]string{"SrcK8S_Namespace", "SrcK8S_OwnerName", "DstK8S_Namespace", "DstK8S_OwnerName", "FlowDirection"},
		),
	}, &authM)
	backendSvc := httptest.NewServer(backendRoutes)
	defer backendSvc.Close()

	nCall := 0

	for _, tc := range testCases {
		t.Run(tc.inputPath, func(t *testing.T) {
			// WHEN the Loki flows endpoint is queried in the backend
			now := time.Now().Unix()
			res, err := backendSvc.Client().Get(backendSvc.URL + "/api/loki/flows" + tc.inputPath)
			require.NoError(t, err)
			body, err := io.ReadAll(res.Body)
			require.NoError(t, err)
			require.Equalf(t, http.StatusOK, res.StatusCode,
				"unexpected return %s: %s", res.Status, string(body))

			// THEN each filter argument has been properly forwarded to Loki
			var expectedURLs []string
			for _, out := range tc.outputQueries {
				expectedURLs = append(expectedURLs, "/loki/api/v1/query_range"+out)
			}

			if len(expectedURLs) > 0 {
				expectedWithTime := injectTime(t, expectedURLs, now)
				for range expectedURLs {
					requestURL := lokiMock.Calls[nCall].Arguments[1].(*http.Request).URL.String()
					assert.Contains(t, expectedWithTime, requestURL)
					nCall++
				}
			} else {
				for i, part := range tc.outputQueryParts {
					requestURL := lokiMock.Calls[nCall].Arguments[1].(*http.Request).URL.String()
					if i == 0 {
						// First part always includes URL
						part = "/loki/api/v1/query_range" + part
					}
					assert.Contains(t, requestURL, part)
				}
				nCall++
			}
		})
	}
}

func injectTime(t *testing.T, queries []string, now int64) []string {
	var modifiedQueries []string
	for _, query := range queries {
		if subMatches := timeNowArg.FindStringSubmatch(query); len(subMatches) > 0 {
			// replace ${timeNow-<seconds>} by time.Now()-<seconds> for arguments where the
			// value is dynamically calculated via the non-mockable time.Now() function
			timeNowDiff, err := strconv.ParseInt(subMatches[1], 10, 64)
			require.NoError(t, err)
			// giving 1-second room to the start time to avoid flaky tests
			expectedStart := int(now - timeNowDiff)
			modifiedQueries = append(modifiedQueries, []string{
				timeNowArg.ReplaceAllString(query, strconv.Itoa(expectedStart-1)),
				timeNowArg.ReplaceAllString(query, strconv.Itoa(expectedStart)),
				timeNowArg.ReplaceAllString(query, strconv.Itoa(expectedStart+1)),
			}...)
		} else {
			modifiedQueries = append(modifiedQueries, query)
		}
	}
	return modifiedQueries
}
