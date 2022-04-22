package httpclient

import (
	"io/ioutil"
	"net"
	"net/http"
	"time"
)

type Interface interface {
	Get(url string) ([]byte, int, error)
}

type httpClient struct {
	Interface
	client  http.Client
	headers map[string][]string
}

func NewHTTPClient(timeout time.Duration, overrideHeaders map[string][]string) Interface {
	transport := &http.Transport{
		DialContext:     (&net.Dialer{Timeout: timeout}).DialContext,
		IdleConnTimeout: timeout,
	}

	return &httpClient{
		client:  http.Client{Transport: transport, Timeout: timeout},
		headers: overrideHeaders,
	}
}

func (hc *httpClient) Get(url string) ([]byte, int, error) {
	// TODO: manage authentication / TLS

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, 0, err
	}
	for k, v := range hc.headers {
		req.Header[k] = v
	}

	resp, err := hc.client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	return body, resp.StatusCode, err
}
