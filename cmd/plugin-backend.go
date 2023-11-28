package main

import (
	"flag"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/handler"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/client"
	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/server"
)

var (
	buildVersion = "unknown"
	buildDate    = "unknown"
	app          = "netobserv-console-plugin"
	logLevel     = flag.String("loglevel", "info", "log level (default: info)")
	configPath   = flag.String("config", "", "path to the console plugin config file")
	versionFlag  = flag.Bool("v", false, "print version")
	log          = logrus.WithField("module", "main")
)

func main() {
	flag.Parse()

	appVersion := fmt.Sprintf("%s [build version: %s, build date: %s]", app, buildVersion, buildDate)
	if *versionFlag {
		fmt.Println(appVersion)
		os.Exit(0)
	}

	lvl, err := logrus.ParseLevel(*logLevel)
	if err != nil {
		log.Errorf("Log level %s not recognized, using info", *logLevel)
		*logLevel = "info"
		lvl = logrus.InfoLevel
	}
	logrus.SetLevel(lvl)
	log.Infof("Starting %s at log level %s", appVersion, *logLevel)

	config, err := handler.ReadConfigFile(buildVersion, buildDate, *configPath)
	if err != nil {
		log.WithError(err).Fatal("error reading config file")
	}

	// check config required fields
	var configErrors []string
	if len(config.Loki.Labels) == 0 {
		configErrors = append(configErrors, "labels cannot be empty")
	}

	// parse config urls
	var lURL, lStatusURL *url.URL
	if len(config.Loki.URL) == 0 {
		configErrors = append(configErrors, "url cannot be empty")
	} else {
		lURL, err = url.Parse(config.Loki.URL)
		if err != nil {
			configErrors = append(configErrors, "wrong Loki URL")
		}
	}
	if len(config.Loki.StatusURL) > 0 {
		lStatusURL, err = url.Parse(config.Loki.StatusURL)
		if err != nil {
			configErrors = append(configErrors, "wrong Loki status URL")
		}
	} else {
		lStatusURL = lURL
	}

	// parse config timeout
	ltimeout, err := time.ParseDuration(config.Loki.Timeout)
	if err != nil {
		configErrors = append(configErrors, "wrong Loki timeout")
	}

	// parse config auth
	var checkType auth.CheckType
	if config.Loki.AuthCheck == "auto" {
		if config.Loki.ForwardUserToken {
			// FORWARD lokiAuth mode
			checkType = auth.CheckAuthenticated
		} else {
			// HOST or DISABLED lokiAuth mode
			checkType = auth.CheckAdmin
		}
		log.Info(fmt.Sprintf("auth-check 'auto' resolved to '%s'", checkType))
	} else {
		checkType = auth.CheckType(config.Loki.AuthCheck)
	}
	if checkType == auth.CheckNone {
		log.Warn("INSECURE: auth checker is disabled")
	}
	checker, err := auth.NewChecker(checkType, client.NewInCluster)
	if err != nil {
		configErrors = append(configErrors, "auth checker error")
	}

	// crash on config errors
	if len(configErrors) > 0 {
		configErrors = append([]string{fmt.Sprintf("Config file has %d errors:\n", len(configErrors))}, configErrors...)
		log.Fatal(strings.Join(configErrors, "\n - "))
	}

	go server.StartMetrics(&server.MetricsConfig{
		Port:     config.Server.MetricsPort,
		CertPath: config.Server.CertPath,
		KeyPath:  config.Server.KeyPath,
	})

	server.Start(&server.Config{
		BuildVersion:     buildVersion,
		BuildDate:        buildDate,
		Port:             config.Server.Port,
		CertPath:         config.Server.CertPath,
		KeyPath:          config.Server.KeyPath,
		CORSAllowOrigin:  config.Server.CORSOrigin,
		CORSAllowMethods: config.Server.CORSMethods,
		CORSAllowHeaders: config.Server.CORSHeaders,
		CORSMaxAge:       config.Server.CORSMaxAge,
		ConfigPath:       *configPath,
		Loki: loki.NewConfig(
			lURL,
			lStatusURL,
			ltimeout,
			config.Loki.TenantID,
			config.Loki.TokenPath,
			config.Loki.ForwardUserToken,
			config.Loki.SkipTLS,
			config.Loki.CAPath,
			config.Loki.StatusSkipTLS,
			config.Loki.CAPath,
			config.Loki.StatusUserCertPath,
			config.Loki.StatusUserKeyPath,
			config.Loki.UseMocks,
			config.Loki.Labels),
	}, checker)
}
