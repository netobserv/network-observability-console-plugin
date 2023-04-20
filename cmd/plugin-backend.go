package main

import (
	"flag"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/auth"
	"github.com/netobserv/network-observability-console-plugin/pkg/kubernetes/client"
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
	lokiURL                = flag.String("loki", "http://localhost:3100", "URL of the loki querier host")
	lokiStatusURL          = flag.String("loki-status", "", "URL for loki /ready /metrics /config endpoints. (default: loki flag value)")
	lokiLabels             = flag.String("loki-labels", "SrcK8S_Namespace,SrcK8S_OwnerName,DstK8S_Namespace,DstK8S_OwnerName,FlowDirection", "Loki labels, comma separated")
	lokiTimeout            = flag.Duration("loki-timeout", 30*time.Second, "Timeout of the Loki query to retrieve logs")
	lokiTenantID           = flag.String("loki-tenant-id", "netobserv", "Tenant organization ID for multi-tenant-loki (submitted as the X-Scope-OrgID HTTP header)")
	lokiTokenPath          = flag.String("loki-token-path", "", "Path to Bearer authorization header for loki gateway")
	lokiForwardUserToken   = flag.Bool("loki-forward-user-token", false, "Forward the user Bearer authorization header for loki gateway, this override loki-token-path option")
	lokiCAPath             = flag.String("loki-ca-path", "", "Path to loki CA certificate")
	lokiSkipTLS            = flag.Bool("loki-skip-tls", false, "Skip TLS checks for loki HTTPS connection")
	lokiStatusCAPath       = flag.String("loki-status-ca-path", "", "Path to loki status CA certificate")
	lokiStatusUserCertPath = flag.String("loki-status-user-cert-path", "", "Path to loki status user cert for mTLS")
	lokiStatusUserKeyPath  = flag.String("loki-status-user-key-path", "", "Path to loki status user key for mTLS")
	lokiStatusSkipTLS      = flag.Bool("loki-status-skip-tls", false, "Skip TLS checks for loki status HTTPS connection")
	lokiMock               = flag.Bool("loki-mock", false, "Fake loki results using saved mocks")
	logLevel               = flag.String("loglevel", "info", "log level (default: info)")
	frontendConfig         = flag.String("frontend-config", "", "path to the console plugin config file")
	authCheck              = flag.String("auth-check", "auto", "type of authentication check: authenticated, admin, auto or none (default is auto, based on loki auth mode)")
	versionFlag            = flag.Bool("v", false, "print version")
	log                    = logrus.WithField("module", "main")
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

	var lStatusURL *url.URL
	if *lokiStatusURL != "" {
		lStatusURL, err = url.Parse(*lokiStatusURL)
		if err != nil {
			log.WithError(err).Fatal("wrong Loki status URL")
		}
	} else {
		lStatusURL = lURL
	}

	lLabels := *lokiLabels
	if len(lLabels) == 0 {
		log.Fatal("labels cannot be empty")
	}

	var checkType auth.CheckType
	if *authCheck == "auto" {
		if *lokiForwardUserToken {
			// FORWARD lokiAuth mode
			checkType = auth.CheckAuthenticated
		} else if *lokiTokenPath != "" {
			// HOST lokiAuth mode
			checkType = auth.CheckAdmin
		} else {
			// DISABLED lokiAuth mode
			checkType = auth.CheckAuthenticated
		}
		log.Info(fmt.Sprintf("auth-check 'auto' resolved to '%s'", checkType))
	} else {
		checkType = auth.CheckType(*authCheck)
	}
	if checkType == auth.CheckNone {
		log.Warn("INSECURE: auth checker is disabled")
	}
	checker, err := auth.NewChecker(checkType, client.NewInCluster)
	if err != nil {
		log.WithError(err).Fatal("auth checker error")
	}

	server.Start(&server.Config{
		Port:             *port,
		CertFile:         *cert,
		PrivateKeyFile:   *key,
		CORSAllowOrigin:  *corsOrigin,
		CORSAllowMethods: *corsMethods,
		CORSAllowHeaders: *corsHeaders,
		CORSMaxAge:       *corsMaxAge,
		Loki:             loki.NewConfig(lURL, lStatusURL, *lokiTimeout, *lokiTenantID, *lokiTokenPath, *lokiForwardUserToken, *lokiSkipTLS, *lokiCAPath, *lokiStatusSkipTLS, *lokiStatusCAPath, *lokiStatusUserCertPath, *lokiStatusUserKeyPath, *lokiMock, strings.Split(lLabels, ",")),
		FrontendConfig:   *frontendConfig,
	}, checker)
}
