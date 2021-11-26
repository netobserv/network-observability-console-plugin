package httpclient

import (
	"io/ioutil"
	"net"
	"net/http"
	"time"
)

func HTTPGet(url string, timeout time.Duration) ([]byte, int, error) {
	// TODO: manage authentication / TLS

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, 0, err
	}

	transport := &http.Transport{
		DialContext:     (&net.Dialer{Timeout: timeout}).DialContext,
		IdleConnTimeout: timeout,
	}

	client := http.Client{Transport: transport, Timeout: timeout}

	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	return body, resp.StatusCode, err
}
