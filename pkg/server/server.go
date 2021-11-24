package server

import (
	"net/http"

	"github.com/sirupsen/logrus"
)

func Start() {
	router := setupRoutes()
	logrus.Info("server listening on port 9001")
	panic(http.ListenAndServe(":9001", router))
}
