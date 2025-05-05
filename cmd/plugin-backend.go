package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"slices"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
	"github.com/netobserv/network-observability-console-plugin/pkg/decoders"
	"github.com/netobserv/network-observability-console-plugin/pkg/model"
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
	log.Infof("Loading config from %s", *configPath)
	cfg, err := config.ReadFile(buildVersion, buildDate, *configPath)
	if err != nil {
		log.WithError(err).Fatal("error reading config file")
	}
	err = cfg.Validate()
	if err != nil {
		log.WithError(err).Fatal("invalid config")
	}

	checker, err := cfg.GetAuthChecker()
	if err != nil {
		log.WithError(err).Fatal("auth checker error")
	}

	if slices.Contains(cfg.Frontend.Features, "networkEvents") {
		// Add decoder hook
		model.AddFlowLineMapping(decoders.NetworkEventsToString)
	}

	ctx := context.Background()
	if cfg.Server.MCP.Enable {
		if err := server.StartMCPServer(ctx, cfg); err != nil && !errors.Is(err, context.Canceled) {
			panic(err)
		}
	} else {
		go server.StartMetrics(&server.MetricsConfig{
			Port:     cfg.Server.MetricsPort,
			CertPath: cfg.Server.CertPath,
			KeyPath:  cfg.Server.KeyPath,
		})

		server.Start(ctx, cfg, checker)
	}
}
