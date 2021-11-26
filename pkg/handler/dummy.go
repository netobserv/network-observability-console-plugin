// TO REMOVE
package handler

import (
	"net/http"

	"github.com/sirupsen/logrus"
)

func Dummy(w http.ResponseWriter, r *http.Request) {
	logrus.Info("dummy handler")
	_, err := w.Write([]byte(""))
	if err != nil {
		logrus.Errorf("could not write response: %v", err)
	}
}
