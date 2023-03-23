package server

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"math/big"
	rnd "math/rand"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/model/fields"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
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

	authM := authMock{}
	authM.MockGranted()

	go func() {
		Start(&Config{
			Loki: loki.Config{
				URL: &url.URL{Scheme: "http", Host: "localhost:3100"},
			},
			Port: testPort,
		}, &authM)
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

func TestServerUnauthorized(t *testing.T) {
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
			Loki: loki.Config{
				URL: &url.URL{Scheme: "http", Host: "localhost:3100"},
			},
			Port: testPort,
		}, &auth.BearerTokenChecker{})
	}()

	t.Logf("Started test http server: %v", serverURL)

	httpConfig := httpClientConfig{}
	httpClient, err := httpConfig.buildHTTPClient()
	if err != nil {
		t.Fatalf("Failed to create http client")
	}

	// wait for our test http server to come up
	checkHTTPReady(httpClient, serverURL)

	_, err = getRequestResults(t, httpClient, serverURL)
	if err != nil {
		t.Fatalf("Failed: could not fetch static files on / (root): %v", err)
	}

	msg, err := getRequestResults(t, httpClient, serverURL+"/api/status")
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", msg)

	msg, err = getRequestResults(t, httpClient, serverURL+"/api/loki/flows")
	require.Error(t, err)
	require.Equal(t, "missing Authorization header", msg)
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
		Loki: loki.Config{
			URL: &url.URL{Scheme: "http", Host: "localhost:3100"},
		},
	}

	serverURL := fmt.Sprintf("https://%s", testServerHostPort)

	// Prepare directory to serve web files
	tmpDirAssets := prepareServerAssets(t)
	defer os.RemoveAll(tmpDirAssets)

	authM := authMock{}
	authM.MockGranted()

	go func() {
		Start(conf, &authM)
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
		_, _ = args.Get(0).(http.ResponseWriter).Write([]byte(`{"status":"","data":{"resultType":"streams","result":[]}}`))
	})
	lokiSvc := httptest.NewServer(&lokiMock)
	defer lokiSvc.Close()
	authM := &authMock{}
	authM.MockGranted()
	lokiURL, err := url.Parse(lokiSvc.URL)
	require.NoError(t, err)

	// THAT is accessed behind the NOO console plugin backend
	backendRoutes := setupRoutes(&Config{
		Loki: loki.Config{
			URL:     lokiURL,
			Timeout: time.Second,
		},
	}, authM)
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
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	var qr model.AggregatedQueryResponse
	err = json.Unmarshal(body, &qr)
	require.NoError(t, err)
	assert.NotNil(t, qr.Result)
}

func TestLokiConfigurationForTopology(t *testing.T) {
	// GIVEN a Loki service
	lokiMock := httpMock{}
	lokiMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		_, _ = args.Get(0).(http.ResponseWriter).Write([]byte(`{"status":"","data":{"resultType":"matrix","result":[]}}`))
	})
	lokiSvc := httptest.NewServer(&lokiMock)
	defer lokiSvc.Close()
	authM := &authMock{}
	authM.MockGranted()
	lokiURL, err := url.Parse(lokiSvc.URL)
	require.NoError(t, err)

	// THAT is accessed behind the NOO console plugin backend
	backendRoutes := setupRoutes(&Config{
		Loki: loki.Config{
			URL:     lokiURL,
			Timeout: time.Second,
			Labels:  utils.GetMapInterface([]string{fields.SrcNamespace, fields.DstNamespace, fields.SrcOwnerName, fields.DstOwnerName, fields.FlowDirection}),
		},
	}, authM)
	backendSvc := httptest.NewServer(backendRoutes)
	defer backendSvc.Close()

	// WHEN the Loki flows endpoint is queried in the backend
	resp, err := backendSvc.Client().Get(backendSvc.URL + "/api/loki/topology")
	require.NoError(t, err)

	// THEN the query has been properly forwarded to Loki
	// Two queries for dedup
	assert.Len(t, lokiMock.Calls, 2)
	req1 := lokiMock.Calls[0].Arguments[1].(*http.Request)
	req2 := lokiMock.Calls[1].Arguments[1].(*http.Request)
	queries := []string{req1.URL.Query().Get("query"), req2.URL.Query().Get("query")}
	expected := []string{
		`topk(100,sum by(SrcK8S_Name,SrcK8S_Type,SrcK8S_OwnerName,SrcK8S_OwnerType,SrcK8S_Namespace,SrcAddr,SrcK8S_HostName,DstK8S_Name,DstK8S_Type,DstK8S_OwnerName,DstK8S_OwnerType,DstK8S_Namespace,DstAddr,DstK8S_HostName) (rate({app="netobserv-flowcollector",FlowDirection="1"}|~` + "`" + `Duplicate":false` + "`" + `|json|unwrap Bytes|__error__=""[1m])))`,
		`topk(100,sum by(SrcK8S_Name,SrcK8S_Type,SrcK8S_OwnerName,SrcK8S_OwnerType,SrcK8S_Namespace,SrcAddr,SrcK8S_HostName,DstK8S_Name,DstK8S_Type,DstK8S_OwnerName,DstK8S_OwnerType,DstK8S_Namespace,DstAddr,DstK8S_HostName) (rate({app="netobserv-flowcollector",FlowDirection="0",SrcK8S_OwnerName=""}|~` + "`" + `Duplicate":false` + "`" + `|json|unwrap Bytes|__error__=""[1m])))`,
	}
	// We don't predict the order so sort both actual and expected
	sort.Strings(queries)
	sort.Strings(expected)
	assert.Equal(t, expected, queries)

	// without any multi-tenancy header
	assert.Empty(t, req1.Header.Get("X-Scope-OrgID"))
	assert.Empty(t, req2.Header.Get("X-Scope-OrgID"))

	// AND the response is sent back to the client
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	var qr model.AggregatedQueryResponse
	err = json.Unmarshal(body, &qr)
	require.NoError(t, err)
	assert.NotNil(t, qr.Result)
}

func TestLokiConfigurationForTableHistogram(t *testing.T) {
	// GIVEN a Loki service
	lokiMock := httpMock{}
	lokiMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		_, _ = args.Get(0).(http.ResponseWriter).Write([]byte(`{"status":"","data":{"resultType":"matrix","result":[]}}`))
	})
	lokiSvc := httptest.NewServer(&lokiMock)
	defer lokiSvc.Close()
	authM := &authMock{}
	authM.MockGranted()
	lokiURL, err := url.Parse(lokiSvc.URL)
	require.NoError(t, err)

	// THAT is accessed behind the NOO console plugin backend
	backendRoutes := setupRoutes(&Config{
		Loki: loki.Config{
			URL:     lokiURL,
			Timeout: time.Second,
			Labels:  utils.GetMapInterface([]string{fields.SrcNamespace, fields.DstNamespace, fields.SrcOwnerName, fields.DstOwnerName, fields.FlowDirection}),
		},
	}, authM)
	backendSvc := httptest.NewServer(backendRoutes)
	defer backendSvc.Close()

	// WHEN the Loki flows endpoint is queried in the backend using count type
	resp, err := backendSvc.Client().Get(backendSvc.URL + "/api/loki/topology?type=count")
	require.NoError(t, err)

	// THEN the query has been properly forwarded to Loki
	// Single query: no dedup for "count"
	assert.Len(t, lokiMock.Calls, 1)
	req1 := lokiMock.Calls[0].Arguments[1].(*http.Request)
	query := req1.URL.Query().Get("query")
	expected :=
		`topk(100,sum by(SrcK8S_Name,SrcK8S_Type,SrcK8S_OwnerName,SrcK8S_OwnerType,SrcK8S_Namespace,SrcAddr,SrcK8S_HostName,DstK8S_Name,DstK8S_Type,DstK8S_OwnerName,DstK8S_OwnerType,DstK8S_Namespace,DstAddr,DstK8S_HostName) (count_over_time({app="netobserv-flowcollector"}|~` + "`" + `Duplicate":false` + "`" + `|json[30s])))`
	assert.Equal(t, expected, query)

	// without any multi-tenancy header
	assert.Empty(t, req1.Header.Get("X-Scope-OrgID"))

	// AND the response is sent back to the client
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	var qr model.AggregatedQueryResponse
	err = json.Unmarshal(body, &qr)
	require.NoError(t, err)
	assert.NotNil(t, qr.Result)
}

func prepareTokenFile(t *testing.T) (string, *os.File) {
	tmpDir, err := os.MkdirTemp("", "server-test")
	require.NoError(t, err)
	tokensPath := filepath.Join(tmpDir, "/var/run/secrets/tokens/")
	err = os.MkdirAll(tokensPath, os.ModePerm)
	require.NoError(t, err)
	dummyfile := filepath.Join(tokensPath, "netobserv-plugin")
	f, err := os.Create(dummyfile)
	require.NoError(t, err)
	_, err = f.WriteString("XXX")
	require.NoError(t, err)
	err = os.Chdir(tmpDir)
	require.NoError(t, err)
	return tmpDir, f
}

func TestLokiConfiguration_MultiTenant(t *testing.T) {
	tmpDir, file := prepareTokenFile(t)
	defer os.RemoveAll(tmpDir)

	lokiMock := httpMock{}
	lokiMock.On("ServeHTTP", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
		_, _ = args.Get(0).(http.ResponseWriter).Write([]byte("{}"))
	}).Twice()
	authM := &authMock{}
	authM.MockGranted()
	lokiSvc := httptest.NewServer(&lokiMock)
	defer lokiSvc.Close()
	lokiURL, err := url.Parse(lokiSvc.URL)
	require.NoError(t, err)

	// GIVEN a NOO console plugin backend configured for HOST Multi tenant mode
	backendRoutes := setupRoutes(&Config{
		Loki: loki.Config{
			URL:       lokiURL,
			Timeout:   time.Second,
			TenantID:  "my-organisation",
			TokenPath: tmpDir + "/var/run/secrets/tokens/netobserv-plugin",
		},
	}, authM)
	backendSvc := httptest.NewServer(backendRoutes)
	defer backendSvc.Close()

	// WHEN the Loki flows endpoint is queried in the backend
	_, err = backendSvc.Client().Get(backendSvc.URL + "/api/loki/flows")
	require.NoError(t, err)

	// THEN the query has been properly forwarded to Loki with the tenant ID header
	req := lokiMock.Calls[0].Arguments[1].(*http.Request)
	assert.Equal(t, "my-organisation", req.Header.Get("X-Scope-OrgID"))
	assert.Equal(t, "Bearer XXX", req.Header.Get("Authorization"))

	// UPDATE token file
	_, err = file.WriteString("+updated")
	require.NoError(t, err)

	// RUN another query
	_, err = backendSvc.Client().Get(backendSvc.URL + "/api/loki/flows")
	require.NoError(t, err)

	// THEN Bearer token is correctly updated
	req = lokiMock.Calls[1].Arguments[1].(*http.Request)
	assert.Equal(t, "my-organisation", req.Header.Get("X-Scope-OrgID"))
	assert.Equal(t, "Bearer XXX+updated", req.Header.Get("Authorization"))
}

type httpMock struct {
	mock.Mock
}

func (l *httpMock) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	_ = l.Called(w, r)
}

type authMock struct {
	mock.Mock
}

func (a *authMock) CheckAuth(ctx context.Context, header http.Header) error {
	args := a.Called(ctx, header)
	return args.Error(0)
}

func (a *authMock) MockGranted() {
	a.On("CheckAuth", mock.Anything, mock.Anything).Return(nil)
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
	bodyBytes, err2 := io.ReadAll(resp.Body)
	if err2 != nil {
		return "", err2
	}
	bodyString := string(bodyBytes)
	if resp.StatusCode == http.StatusOK {
		return bodyString, nil
	}
	return bodyString, fmt.Errorf("Bad status: %v", resp.StatusCode)
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
		}
		time.Sleep(time.Second)
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
