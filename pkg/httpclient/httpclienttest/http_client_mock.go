package httpclienttest

import (
	"github.com/stretchr/testify/mock"
)

type HTTPClientMock struct {
	mock.Mock
}

func (o *HTTPClientMock) Get(url string) ([]byte, int, error) {
	args := o.Called(url)
	return args.Get(0).([]byte), args.Int(1), args.Error(2)
}

func (o *HTTPClientMock) SpyURL(fn func(url string)) {
	o.On("Get", mock.AnythingOfType("string")).
		Run(func(args mock.Arguments) { fn(args[0].(string)) }).
		Return([]byte{}, 0, nil)
}
