# Network Observability plugin for Openshift Console

Based on [Openshift Console dynamic plugin](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk), this plugin implement the console elements for Network Observability.

## Building, testing

To build the plugin, run:

```bash
make build
```

This is equivalent to the npm commands `npm install && npm run build`.

To run tests and linter:

```bash
make test lint
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
