package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/config"
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

func getContext() (ctx context.Context) {
	logrus.Infof("push CTRL+C or send SIGTERM to interrupt execution")
	ctx, canceler := context.WithCancel(context.Background())
	// Subscribe to signals for terminating the program.
	go func() {
		stopper := make(chan os.Signal, 1)
		signal.Notify(stopper, os.Interrupt, syscall.SIGTERM)
		<-stopper
		canceler()
	}()
	return ctx
}

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

	cfg, err := config.ReadFile(buildVersion, buildDate, *configPath)
	if err != nil {
		log.WithError(err).Fatal("error reading config file")
	}
	err = cfg.Validate()
	if err != nil {
		log.WithError(err).Fatal("invalid config")
	}

	ctx := getContext()

	checker, err := cfg.GetAuthChecker()
	if err != nil {
		log.WithError(err).Fatal("auth checker error")
	}

	go server.StartMetrics(&server.MetricsConfig{
		Port:     cfg.Server.MetricsPort,
		CertPath: cfg.Server.CertPath,
		KeyPath:  cfg.Server.KeyPath,
	})

	server.Start(ctx, cfg, checker)
}
