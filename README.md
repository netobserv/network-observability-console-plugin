# Network Observability plugin for Openshift Console

Based on [Openshift Console dynamic plugin](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk), this plugin implement the console elements for Network Observability.

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
You need also to have a local clone of the [console repository](https://github.com/openshift/console).
Then, start the console bridge with this local plugin, with:

```bash
CONSOLE=/path/to/console make bridge
```

Then open http://localhost:9000/.

If you have troubles trying to run the console, refer to their doc: https://github.com/openshift/console/#openshift-no-authentication.

### Loki setup

WIP / FIXME

Currently just dev mode is supported to fetch data from Loki. It means that you need to run the commands described above to run the plugin (`make serve` / `make bridge`).

You also need to deploy Loki and port-forward on your host: `oc port-forward service/loki 3100:3100`

(You don't need Grafana)

For next steps, we'll need to use the console proxy feature to fetch in-cluster Loki, which will be supported via this story: https://issues.redhat.com/browse/CONSOLE-2892

## OCI Image

Images are located on https://quay.io/repository/netobserv/network-observability-console-plugin. To use the latest image corresponding to branch `main`, use `quay.io/netobserv/network-observability-console-plugin:main`.

### Build

```bash
# build the default image (quay.io/netobserv/network-observability-console-plugin:latest):
make image

# build and push on your own quay.io account (quay.io/myuser/network-observability-console-plugin:latest):
USER=myuser make image push

# build and push on a different registry
IMAGE=dockerhub.io/myuser/plugin:tag make image push
```
