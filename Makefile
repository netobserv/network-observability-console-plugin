USER ?= netobserv
VERSION ?= latest
IMAGE ?= quay.io/${USER}/network-observability-console-plugin:${VERSION}

ifeq (,$(shell which podman 2>/dev/null))
OCI_BIN ?= docker
else
OCI_BIN ?= podman
endif

.PHONY: lint
lint:
	@echo "### Linting code"
	npm run lint

.PHONY: test
test:
	@echo "### Testing"
	npm run test

.PHONY: build
build:
	@echo "### Building"
	npm install && npm run build

.PHONY: image
image:
	@echo "### Building image with ${OCI_BIN}"
	$(OCI_BIN) build -t $(IMAGE) .

.PHONY: push
push:
	$(OCI_BIN) push $(IMAGE)

.PHONY: serve
serve:
	./http-server.sh

.PHONY: bridge
bridge:
ifeq (,${CONSOLE})
	@echo "CONSOLE must be set to your local path of the console repository clone. E.g. CONSOLE=/path/to/console make bridge"
else
	@echo "### Setting bridge from ${CONSOLE} to http://localhost:9000/netflow-traffic"
	cd ${CONSOLE} && source contrib/oc-environment.sh && ./bin/bridge -plugins network-observability-plugin=http://localhost:9001/
	cd -
endif
