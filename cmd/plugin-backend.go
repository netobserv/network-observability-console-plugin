package main

import (
	"flag"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/loki"
	"github.com/netobserv/network-observability-console-plugin/pkg/server"
)

var (
	buildVersion = "unknown"
	buildDate    = "unknown"
	app          = "netobserv-console-plugin"
	port         = flag.Int("port", 9001, "server port to listen on (default: 9001)")
	cert         = flag.String("cert", "", "cert file path to enable TLS (disabled by default)")
	key          = flag.String("key", "", "private key file path to enable TLS (disabled by default)")
	corsOrigin   = flag.String("cors-origin", "*", "CORS allowed origin (default: *)")
	corsMethods  = flag.String("cors-methods", "", "CORS allowed methods (default: unset)")
	corsHeaders  = flag.String("cors-headers", "Origin, X-Requested-With, Content-Type, Accept", "CORS allowed headers (default: Origin, X-Requested-With, Content-Type, Accept)")
	corsMaxAge   = flag.String("cors-max-age", "", "CORS allowed max age (default: unset)")
	// todo: default value temporarily kept to make it work with older versions of the NOO. Remove default and force setup of loki url
	lokiURL        = flag.String("loki", "http://localhost:3100", "URL of the loki querier host")
	lokiLabels     = flag.String("loki-labels", "SrcK8S_Namespace,SrcK8S_OwnerName,DstK8S_Namespace,DstK8S_OwnerName,FlowDirection", "Loki labels, comma separated")
	lokiTimeout    = flag.Duration("loki-timeout", 10*time.Second, "Timeout of the Loki query to retrieve logs")
	lokiTenantID   = flag.String("loki-tenant-id", "", "Tenant organization ID for multi-tenant-loki (submitted as the X-Scope-OrgID HTTP header)")
	logLevel       = flag.String("loglevel", "info", "log level (default: info)")
	frontendConfig = flag.String("frontend-config", "", "path to the console plugin config file")
	versionFlag    = flag.Bool("v", false, "print version")
	log            = logrus.WithField("module", "main")
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

	lURL, err := url.Parse(*lokiURL)
	if err != nil {
		log.WithError(err).Fatal("wrong Loki URL")
	}

	lLabels := *lokiLabels
	if len(lLabels) == 0 {
		log.Fatal("labels cannot be empty")
	}

	server.Start(&server.Config{
		Port:             *port,
		CertFile:         *cert,
		PrivateKeyFile:   *key,
		CORSAllowOrigin:  *corsOrigin,
		CORSAllowMethods: *corsMethods,
		CORSAllowHeaders: *corsHeaders,
		CORSMaxAge:       *corsMaxAge,
		Loki:             loki.NewConfig(lURL, *lokiTimeout, *lokiTenantID, strings.Split(lLabels, ",")),
		FrontendConfig: *frontendConfig,
	})
}
