# Network Observability plugin for Openshift Console

[![Docker Repository on Quay](https://quay.io/repository/netobserv/network-observability-console-plugin/status "Docker Repository on Quay")](https://quay.io/repository/netobserv/network-observability-console-plugin)

Based on [Openshift Console dynamic plugin](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk), this plugin implement the console elements for Network Observability.

## First setup

You will need Go, Node.js and npm in order to run the `make` commands described below. You can take a look at the [Dockerfile](./Dockerfile) to get known working versions of these tools. In particular, node and npm are known to often break builds if you don't use the expected versions (even patch versions for npm). You can use [nvm](https://github.com/nvm-sh/nvm) to manage installed node / npm versions.

Once these tools are installed, run the following command:

```bash
make install-frontend
```

## Building, linting, testing

To build the plugin, run:

```bash
make build
```

To run tests and linter:

```bash
make test lint
```

These targets will build / lint / test both the backend and the frontend. They have selective equivalent to build/lint/test only the backend or the frontend (e.g. `make build-frontend`).

There are also convenient targets to build+lint+test the backend or the frontend:

```bash
make frontend
make backend
```

## Development environment

Plugin can be served locally using the following command:

```bash
make serve
```

(It's the same as running ./http-server.sh)

Make sure you are logged in your OpenShift cluster before with the CLI (`oc login -u kubeadmin` ...)

You need also to have a local copy of [console repository](https://github.com/openshift/console)
Build it once using:
```bash
./build.sh
```

Then, start the console bridge with this local plugin, with:
```bash
CONSOLE=/path/to/console make bridge
```

Then open http://localhost:9000/.

If you have troubles trying to run the console, refer to their doc: https://github.com/openshift/console/#openshift-no-authentication.

### Loki in dev mode

You need to deploy Loki and port-forward on your host: `oc port-forward service/loki 3100:3100`

(You don't need Grafana)

## OCI Image

Images are located on https://quay.io/repository/netobserv/network-observability-console-plugin. To use the latest image corresponding to branch `main`, use `quay.io/netobserv/network-observability-console-plugin:main`.

### Build

```bash
# build the default image (quay.io/netobserv/network-observability-console-plugin:main):
make image

# build and push on your own quay.io account (quay.io/myuser/network-observability-console-plugin:main):
IMG_USER=myuser make image push

# build and push on a different registry
IMAGE=dockerhub.io/myuser/plugin:tag make image push
```

### Testing in OpenShift

Probably the easiest way to test without dev mode (e.g. to test a pull request) is to use the [operator](https://github.com/netobserv/network-observability-operator/), build and push the image to your own registry account and update the `FlowCollector` CR to update the plugin image.

E.g:

```bash
IMAGE=quay.io/${USER}/network-observability-console-plugin:pr-xx make image push

oc edit FlowCollector cluster
# Here replace image with the newly created one under .spec.consolePlugin.image
```

If you had previously used the console with the plugin installed, you may need to restart console pods to clear cache:

```bash
oc delete pods -n openshift-console -l app=console
```
