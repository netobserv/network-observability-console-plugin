package apierrors

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sirupsen/logrus"
)

var hlog = logrus.WithField("module", "apierrors")

type StructuredError interface {
	error
	Write(w http.ResponseWriter, code int)
}

type GenericError struct {
	StructuredError `json:"-"`
	Message         string `json:"message,omitempty"`
}

func (e *GenericError) Error() string {
	return e.Message
}

func (e *GenericError) Write(w http.ResponseWriter, code int) {
	WriteStructured(w, code, e)
}

func Write(w http.ResponseWriter, code int, err error) {
	var serr StructuredError
	if errors.As(err, &serr) {
		WriteStructured(w, code, serr)
	} else {
		WriteStructured(w, code, &GenericError{Message: err.Error()})
	}
}

func WriteStructured(w http.ResponseWriter, code int, httpErr StructuredError) {
	r, err := json.Marshal(httpErr)
	if err != nil {
		hlog.Errorf("Marshalling error while responding an error: %v (message was: %s)", err, httpErr.Error())
		code = http.StatusInternalServerError
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err = w.Write(r)
	if err != nil {
		hlog.Errorf("Error while responding an error: %v (message was: %s)", err, httpErr.Error())
	}
}
