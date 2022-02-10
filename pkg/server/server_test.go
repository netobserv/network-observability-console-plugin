package server

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"math/big"
	rnd "math/rand"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
)

const (
	testHostname = "127.0.0.1"
)

func TestServerRunning(t *testing.T) {
	testPort, err := getFreePort(testHostname)
	if err != nil {
		t.Fatalf("Cannot get a free port to run tests on host [%v]", testHostname)
	} else {
		t.Logf("Will use free port [%v] on host [%v] for tests", testPort, testHostname)
	}

	testServerHostPort := fmt.Sprintf("%v:%v", testHostname, testPort)

	rnd.Seed(time.Now().UnixNano())

	serverURL := fmt.Sprintf("http://%s", testServerHostPort)

	// Prepare directory to serve web files
	tmpDir := prepareServerAssets(t)
	defer os.RemoveAll(tmpDir)

	go func() {
		Start(&Config{
			Loki: handler.LokiConfig{
				URL: &url.URL{Scheme: "http", Host: "localhost:3100"},
			},
			Port: testPort,
		})
	}()

	t.Logf("Started test http server: %v", serverURL)

	httpConfig := httpClientConfig{}
	httpClient, err := httpConfig.buildHTTPClient()
	if err != nil {
		t.Fatalf("Failed to create http client")
	}

	// wait for our test http server to come up
	checkHTTPReady(httpClient, serverURL)

	if _, err = getRequestResults(t, httpClient, serverURL); err != nil {
		t.Fatalf("Failed: could not fetch static files on / (root): %v", err)
	}

	if _, err = getRequestResults(t, httpClient, serverURL+"/api/status"); err != nil {
		t.Fatalf("Failed: could not fetch API endpoint: %v", err)
	}

	// sanity check - make sure we cannot get to a bogus context path
	if _, err = getRequestResults(t, httpClient, serverURL+"/badroot"); err == nil {
		t.Fatalf("Failed: Should have failed going to /badroot")
	}
}

func TestSecureComm(t *testing.T) {
	testPort, err := getFreePort(testHostname)
	if err != nil {
		t.Fatalf("Cannot get a free port to run tests on host [%v]", testHostname)
	} else {
		t.Logf("Will use free port [%v] on host [%v] for tests", testPort, testHostname)
	}
	testMetricsPort, err := getFreePort(testHostname)
	if err != nil {
		t.Fatalf("Cannot get a free metrics port to run tests on host [%v]", testHostname)
	} else {
		t.Logf("Will use free metrics port [%v] on host [%v] for tests", testMetricsPort, testHostname)
	}

	tmpDir, err := os.MkdirTemp("", "server-test")
	require.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	testServerCertFile := tmpDir + "/server-test-server.cert"
	testServerKeyFile := tmpDir + "/server-test-server.key"
	testServerHostPort := fmt.Sprintf("%v:%v", testHostname, testPort)
	err = generateCertificate(t, testServerCertFile, testServerKeyFile, testServerHostPort)
	if err != nil {
		t.Fatalf("Failed to create server cert/key files: %v", err)
	}
	defer os.Remove(testServerCertFile)
	defer os.Remove(testServerKeyFile)

	testClientCertFile := tmpDir + "/server-test-client.cert"
	testClientKeyFile := tmpDir + "/server-test-client.key"
	testClientHost := testHostname
	err = generateCertificate(t, testClientCertFile, testClientKeyFile, testClientHost)
	if err != nil {
		t.Fatalf("Failed to create client cert/key files: %v", err)
	}
	defer os.Remove(testClientCertFile)
	defer os.Remove(testClientKeyFile)

	rnd.Seed(time.Now().UnixNano())
	conf := &Config{
		CertFile:       testServerCertFile,
		PrivateKeyFile: testServerKeyFile,
		Port:           testPort,
		Loki: handler.LokiConfig{
			URL: &url.URL{Scheme: "http", Host: "localhost:3100"},
		},
	}

	serverURL := fmt.Sprintf("https://%s", testServerHostPort)

	// Prepare directory to serve web files
	tmpDirAssets := prepareServerAssets(t)
	defer os.RemoveAll(tmpDirAssets)

	go func() {
		Start(conf)
	}()
	t.Logf("Started test http server: %v", serverURL)

	httpConfig := httpClientConfig{
		CertFile:       testClientCertFile,
		PrivateKeyFile: testClientKeyFile,
		TLSConfig: &tls.Config{
			InsecureSkipVerify: true,
		},
	}
	httpClient, err := httpConfig.buildHTTPClient()
	if err != nil {
		t.Fatalf("Failed to create http client")
	}

	// wait for our test http server to come up
	checkHTTPReady(httpClient, serverURL+"/status")

	if _, err = getRequestResults(t, httpClient, serverURL); err != nil {
		t.Fatalf("Failed: could not fetch static files on / (root): %v", err)
	}

	if _, err = getRequestResults(t, httpClient, serverURL+"/api/status"); err != nil {
		t.Fatalf("Failed: could not fetch API endpoint: %v", err)
	}

	// Make sure the server rejects anything trying to use TLS 1.1 or under
	httpConfigTLS11 := httpClientConfig{
		CertFile:       testClientCertFile,
		PrivateKeyFile: testClientKeyFile,
		TLSConfig: &tls.Config{
			InsecureSkipVerify: true,
			MinVersion:         tls.VersionTLS10,
			MaxVersion:         tls.VersionTLS11,
		},
	}
	httpClientTLS11, err := httpConfigTLS11.buildHTTPClient()
	if err != nil {
		t.Fatalf("Failed to create http client with TLS 1.1")
	}
	if _, err = getRequestResults(t, httpClientTLS11, serverURL); err == nil {
		t.Fatalf("Failed: should not have been able to use TLS 1.1")
	}
}

func TestLokiConfiguration(t *testing.T) {
	// GIVEN a Loki service
	lokiMock := httpMock{}
	lokiMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		_, _ = args.Get(0).(http.ResponseWriter).Write([]byte(`{"hello":"world!"}`))
	}).Once()
	lokiSvc := httptest.NewServer(&lokiMock)
	defer lokiSvc.Close()
	lokiURL, err := url.Parse(lokiSvc.URL)
	require.NoError(t, err)

	// THAT is accessed behind the NOO console plugin backend
	backendRoutes := setupRoutes(&Config{
		Loki: handler.LokiConfig{
			URL:     lokiURL,
			Timeout: time.Second,
		},
	})
	backendSvc := httptest.NewServer(backendRoutes)
	defer backendSvc.Close()

	// WHEN the Loki flows endpoint is queried in the backend
	resp, err := backendSvc.Client().Get(backendSvc.URL + "/api/loki/flows")
	require.NoError(t, err)

	// THEN the query has been properly forwarded to Loki
	req := lokiMock.Calls[0].Arguments[1].(*http.Request)
	assert.Equal(t, `{app="netobserv-flowcollector"}`, req.URL.Query().Get("query"))
	// without any multi-tenancy header
	assert.Empty(t, req.Header.Get("X-Scope-OrgID"))

	// AND the response is sent back to the client
	body, err := ioutil.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Equal(t, `{"hello":"world!"}`, string(body))
}

func TestLokiConfiguration_MultiTenant(t *testing.T) {
	lokiMock := httpMock{}
	lokiMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		_, _ = args.Get(0).(http.ResponseWriter).Write([]byte("{}"))
	}).Once()
	lokiSvc := httptest.NewServer(&lokiMock)
	defer lokiSvc.Close()
	lokiURL, err := url.Parse(lokiSvc.URL)
	require.NoError(t, err)

	// GIVEN a NOO console plugin backend configured for Multi tenant mode
	backendRoutes := setupRoutes(&Config{
		Loki: handler.LokiConfig{
			URL:      lokiURL,
			Timeout:  time.Second,
			TenantID: "my-organisation",
		},
	})
	backendSvc := httptest.NewServer(backendRoutes)
	defer backendSvc.Close()

	// WHEN the Loki flows endpoint is queried in the backend
	_, err = backendSvc.Client().Get(backendSvc.URL + "/api/loki/flows")
	require.NoError(t, err)

	// THEN the query has been properly forwarded to Loki with the tenant ID header
	req := lokiMock.Calls[0].Arguments[1].(*http.Request)
	assert.Equal(t, "my-organisation", req.Header.Get("X-Scope-OrgID"))
}

func TestLokiFiltering(t *testing.T) {
	testCases := []struct {
		inputPath string
		// since some arguments might be processed/appended in different order, this field
		// contains the different permutations for such arguments
		outputQuery []string
	}{{
		inputPath: "?SrcPod=test-pod",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`\"SrcPod\":\"[^\"]*test-pod`",
		},
	}, {
		inputPath: "?SrcPod=test-pod&match=any",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`\"SrcPod\":\"[^\"]*test-pod`",
		},
	}, {
		inputPath: "?Proto=6&match=all",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`\"Proto\":6`",
		},
	}, {
		inputPath: "?Proto=6&match=any",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`\"Proto\":6`",
		},
	}, {
		inputPath: "?Proto=6&SrcPod=test",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`\"Proto\":6`|~`\"SrcPod\":\"[^\"]*test`",
			"?query={app=\"netobserv-flowcollector\"}|~`\"SrcPod\":\"[^\"]*test`|~`\"Proto\":6`",
		},
	}, {
		inputPath: "?Proto=6&SrcPod=test&match=any",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`(\"Proto\":6)|(\"SrcPod\":\"[^\"]*test)`",
			"?query={app=\"netobserv-flowcollector\"}|~`(\"SrcPod\":\"[^\"]*test)|(\"Proto\":6)`",
		},
	}, {
		inputPath: "?Proto=6&SrcPod=test&FlowDirection=1&match=any",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`(\"Proto\":6)|(\"SrcPod\":\"[^\"]*test)`|~`\"FlowDirection\":1`",
			"?query={app=\"netobserv-flowcollector\"}|~`(\"SrcPod\":\"[^\"]*test)|(\"Proto\":6)`|~`\"FlowDirection\":1`",
		},
	}, {
		inputPath: "?SrcNamespace=test-namespace&match=all",
		outputQuery: []string{
			`?query={SrcNamespace=~".*test-namespace.*",app="netobserv-flowcollector"}`,
		},
	}, {
		inputPath: "?SrcNamespace=test-namespace&match=any",
		outputQuery: []string{
			`?query={SrcNamespace=~".*test-namespace.*",app="netobserv-flowcollector"}`,
		},
	}, {
		inputPath: "?SrcPort=8080&SrcAddr=10.128.0.1&SrcNamespace=default",
		outputQuery: []string{
			"?query={SrcNamespace=~\".*default.*\",app=\"netobserv-flowcollector\"}|~`\"SrcPort\":8080`|json|SrcAddr=ip(\"10.128.0.1\")",
		},
	}, {
		inputPath: "?SrcPort=8080&SrcAddr=10.128.0.1&SrcNamespace=default&match=any",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|json|SrcNamespace=~\".*default.*\"+or+SrcAddr=ip(\"10.128.0.1\")+or+SrcPort=8080",
		},
	}, {
		inputPath: "?SrcPort=8080&SrcAddr=10.128.0.1&SrcNamespace=default&match=any&FlowDirection=0",
		outputQuery: []string{
			"?query={app=\"netobserv-flowcollector\"}|~`\"FlowDirection\":0`|json|SrcNamespace=~\".*default.*\"+or+SrcAddr=ip(\"10.128.0.1\")+or+SrcPort=8080",
		},
	}, {
		inputPath:   "?startTime=1640991600&match=all",
		outputQuery: []string{`?query={app="netobserv-flowcollector"}&start=1640991600`},
	}, {
		inputPath:   "?startTime=1640991600&match=any",
		outputQuery: []string{`?query={app="netobserv-flowcollector"}&start=1640991600`},
	}, {
		inputPath:   "?endTime=1641160800",
		outputQuery: []string{`?query={app="netobserv-flowcollector"}&end=1641160800`},
	}, {
		inputPath:   "?endTime=1641160800&match=any",
		outputQuery: []string{`?query={app="netobserv-flowcollector"}&end=1641160800`},
	}, {
		inputPath: "?startTime=1640991600&endTime=1641160800&match=all",
		outputQuery: []string{
			`?query={app="netobserv-flowcollector"}&start=1640991600&end=1641160800`,
			`?query={app="netobserv-flowcollector"}&end=1641160800&start=1640991600`,
		},
	}, {
		inputPath: "?startTime=1640991600&endTime=1641160800&match=any",
		outputQuery: []string{
			`?query={app="netobserv-flowcollector"}&end=1641160800&start=1640991600`,
			`?query={app="netobserv-flowcollector"}&start=1640991600&end=1641160800`,
		},
	}, {
		inputPath:   "?timeRange=300000",
		outputQuery: []string{`?query={app="netobserv-flowcollector"}&start=${timeNow-300000}`},
	}, {
		inputPath:   "?timeRange=300000&match=any",
		outputQuery: []string{`?query={app="netobserv-flowcollector"}&start=${timeNow-300000}`},
	}, {
		inputPath:   "?timeRange=86400000&match=all",
		outputQuery: []string{`?query={app="netobserv-flowcollector"}&start=${timeNow-86400000}`},
	}, {
		inputPath:   "?timeRange=86400000&match=any",
		outputQuery: []string{`?query={app="netobserv-flowcollector"}&start=${timeNow-86400000}`},
	}}

	// GIVEN a Loki service
	lokiMock := httpMock{}
	lokiMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		_, _ = args.Get(0).(http.ResponseWriter).Write([]byte(`{}`))
	}).Times(len(testCases))
	lokiSvc := httptest.NewServer(&lokiMock)
	defer lokiSvc.Close()
	lokiURL, err := url.Parse(lokiSvc.URL)
	require.NoError(t, err)

	// THAT is accessed behind the NOO console plugin backend
	backendRoutes := setupRoutes(&Config{
		Loki: handler.LokiConfig{
			URL:     lokiURL,
			Timeout: time.Second,
		},
	})
	backendSvc := httptest.NewServer(backendRoutes)
	defer backendSvc.Close()

	timeNowArg := regexp.MustCompile(`\${timeNow-(\d+)}`)

	for index, tc := range testCases {
		t.Run(tc.inputPath, func(t *testing.T) {
			// WHEN the Loki flows endpoint is queried in the backend
			now := time.Now().Unix()
			res, err := backendSvc.Client().Get(backendSvc.URL + "/api/loki/flows" + tc.inputPath)
			require.NoError(t, err)
			body, err := ioutil.ReadAll(res.Body)
			require.NoError(t, err)
			require.Equalf(t, http.StatusOK, res.StatusCode,
				"unexpected return %s: %s", res.Status, string(body))

			// THEN each filter argument has been properly forwarded to Loki
			var expectedURLs []string
			for _, out := range tc.outputQuery {
				expectedURLs = append(expectedURLs, "/loki/api/v1/query_range"+out)
			}

			requestURL := lokiMock.Calls[index].Arguments[1].(*http.Request).URL.String()
			if subMatches := timeNowArg.FindStringSubmatch(tc.outputQuery[0]); len(subMatches) == 0 {
				assert.Contains(t, expectedURLs, requestURL)
			} else {
				// replace ${timeNow-<seconds>} by time.Now()-<seconds> for arguments where the
				// value is dynamically calculated via the non-mockable time.Now() function
				timeNowDiff, err := strconv.ParseInt(subMatches[1], 10, 64)
				require.NoError(t, err)
				// giving 1-second room to the start time to avoid flaky tests
				expectedStart := int(now - timeNowDiff)
				var possibleQueries []string
				for _, exp := range expectedURLs {
					possibleQueries = append(possibleQueries, []string{
						timeNowArg.ReplaceAllString(exp, strconv.Itoa(expectedStart-1)),
						timeNowArg.ReplaceAllString(exp, strconv.Itoa(expectedStart)),
						timeNowArg.ReplaceAllString(exp, strconv.Itoa(expectedStart+1)),
					}...)
				}
				assert.Contains(t, possibleQueries, requestURL)
			}
		})
	}
}

type httpMock struct {
	mock.Mock
}

func (l *httpMock) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	_ = l.Called(w, r)
}

func prepareServerAssets(t *testing.T) string {
	tmpDir, err := os.MkdirTemp("", "server-test")
	require.NoError(t, err)
	distpath := filepath.Join(tmpDir, "web/dist")
	err = os.MkdirAll(distpath, os.ModePerm)
	require.NoError(t, err)
	dummyfile := filepath.Join(distpath, "dummy")
	_, err = os.Create(dummyfile)
	require.NoError(t, err)
	err = os.Chdir(tmpDir)
	require.NoError(t, err)
	return tmpDir
}

func getRequestResults(t *testing.T, httpClient *http.Client, url string) (string, error) {
	r, err := http.NewRequest("GET", url, nil)
	if err != nil {
		t.Fatal(err)
		return "", err
	}

	resp, err := httpClient.Do(r)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusOK {
		bodyBytes, err2 := ioutil.ReadAll(resp.Body)
		if err2 != nil {
			return "", err2
		}
		bodyString := string(bodyBytes)
		return bodyString, nil
	}
	return "", fmt.Errorf("Bad status: %v", resp.StatusCode)
}

func generateCertificate(t *testing.T, certPath string, keyPath string, host string) error {
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return err
	}

	serialNumber, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		return err
	}

	notBefore := time.Now()
	notAfter := notBefore.Add(365 * 24 * time.Hour)

	template := x509.Certificate{
		SerialNumber:          serialNumber,
		NotBefore:             notBefore,
		NotAfter:              notAfter,
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		Subject: pkix.Name{
			Organization: []string{"ABC Corp."},
		},
	}

	hosts := strings.Split(host, ",")
	for _, h := range hosts {
		if ip := net.ParseIP(h); ip != nil {
			template.IPAddresses = append(template.IPAddresses, ip)
		} else {
			template.DNSNames = append(template.DNSNames, h)
		}
	}

	template.IsCA = true
	template.KeyUsage |= x509.KeyUsageCertSign

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		return err
	}

	certOut, err := os.Create(certPath)
	if err != nil {
		return err
	}
	_ = pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	certOut.Close()

	keyOut, err := os.OpenFile(keyPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}

	pemBlockForKey := &pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(priv)}
	_ = pem.Encode(keyOut, pemBlockForKey)
	keyOut.Close()

	t.Logf("Generated security data: %v|%v|%v", certPath, keyPath, host)
	return nil
}

func getFreePort(host string) (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", host+":0")
	if err != nil {
		return 0, err
	}

	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

func checkHTTPReady(httpClient *http.Client, url string) {
	for i := 0; i < 60; i++ {
		if r, err := httpClient.Get(url); err == nil {
			r.Body.Close()
			break
		} else {
			time.Sleep(time.Second)
		}
	}
}

// A generic HTTP client used to test accessing the server
type httpClientConfig struct {
	CertFile       string
	PrivateKeyFile string
	TLSConfig      *tls.Config
	HTTPTransport  *http.Transport
}

func (conf *httpClientConfig) buildHTTPClient() (*http.Client, error) {

	// make our own copy of TLS config
	tlsConfig := &tls.Config{}
	if conf.TLSConfig != nil {
		tlsConfig = conf.TLSConfig
	}

	if conf.CertFile != "" {
		cert, err := tls.LoadX509KeyPair(conf.CertFile, conf.PrivateKeyFile)
		if err != nil {
			return nil, fmt.Errorf("Error loading the client certificates: %w", err)
		}
		tlsConfig.Certificates = append(tlsConfig.Certificates, cert)
	}

	// make our own copy of HTTP transport
	transport := &http.Transport{}
	if conf.HTTPTransport != nil {
		transport = conf.HTTPTransport
	}

	// make sure the transport has some things we know we need
	transport.TLSClientConfig = tlsConfig

	if transport.IdleConnTimeout == 0 {
		transport.IdleConnTimeout = time.Second * 600
	}
	if transport.ResponseHeaderTimeout == 0 {
		transport.ResponseHeaderTimeout = time.Second * 600
	}

	// build the http client
	httpClient := http.Client{Transport: transport}

	return &httpClient, nil
}
