USER ?= netobserv
VERSION ?= latest
IMAGE ?= quay.io/${USER}/network-observability-console-plugin:${VERSION}
GOLANGCI_LINT_VERSION = v1.42.1
COVERPROFILE = coverage.out

ifeq (,$(shell which podman 2>/dev/null))
OCI_BIN ?= docker
else
OCI_BIN ?= podman
endif

.PHONY: prereqs
prereqs:
	@echo "### Test if prerequisites are met, and installing missing dependencies"
	test -f $(go env GOPATH)/bin/golangci-lint || go install github.com/golangci/golangci-lint/cmd/golangci-lint@${GOLANGCI_LINT_VERSION}

.PHONY: vendors
vendors:
	@echo "### Checking vendors"
	go mod tidy && go mod vendor

.PHONY: fmt
fmt:
	go fmt ./...

.PHONY: lint
lint: prereqs
	@echo "### Linting code"
	golangci-lint run ./...
	cd web && npm run lint

.PHONY: test
test:
	@echo "### Testing"
	go test ./... -coverprofile ${COVERPROFILE}
	cd web && npm run test

.PHONY: build
build:
	@echo "### Building"
	go build -mod vendor -o plugin-backend cmd/plugin-backend.go
	cd web && npm install && npm run build

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
