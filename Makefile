IMG_USER ?= netobserv
TAG ?= dev
BUILD_VERSION := $(shell git describe --long HEAD)
BUILD_DATE := $(shell date +%Y-%m-%d\ %H:%M)
BUILD_SHA := $(shell git rev-parse --short HEAD)

BASE_IMAGE ?= quay.io/${IMG_USER}/network-observability-console-plugin
IMAGE ?= ${BASE_IMAGE}:${TAG}

GOLANGCI_LINT_VERSION = v1.42.1
COVERPROFILE = coverage.out
NPM_INSTALL ?= install

ifeq (,$(shell which podman 2>/dev/null))
OCI_BIN ?= docker
else
OCI_BIN ?= podman
endif

.PHONY: prereqs
prereqs:
	@echo "### Test if prerequisites are met, and installing missing dependencies"
	test -f $(go env GOPATH)/bin/golangci-lint || GOFLAGS="" go install github.com/golangci/golangci-lint/cmd/golangci-lint@${GOLANGCI_LINT_VERSION}

.PHONY: vendors
vendors:
	@echo "### Checking vendors"
	go mod tidy && go mod vendor

.PHONY: install-frontend
install-frontend:
	@echo "### Installing frontend dependencies"
	cd web && npm ${NPM_INSTALL}

.PHONY: fmt-backend
fmt-backend:
	go fmt ./...

.PHONY: fmt-frontend
fmt-frontend:
	cd web && npm run format-all

.PHONY: fmt
fmt: fmt-backend fmt-frontend

.PHONY: lint-backend
lint-backend: prereqs
	@echo "### Linting backend code"
	golangci-lint run ./...

.PHONY: lint-frontend
lint-frontend:
	@echo "### Linting frontend code"
	cd web && npm run lint

.PHONY: lint
lint: lint-backend lint-frontend

.PHONY: i18n
i18n:
	@echo "### generating frontend locales"
	cd web && npm run i18n

.PHONY: test-backend
test-backend:
	@echo "### Testing backend"
	go test ./... -coverprofile ${COVERPROFILE}

.PHONY: test-frontend
test-frontend:
	@echo "### Testing frontend"
	cd web && npm run test

.PHONY: test
test: test-backend test-frontend

.PHONY: build-backend
build-backend: fmt-backend
	@echo "### Building backend"
	go build -ldflags "-X 'main.buildVersion=${BUILD_VERSION}' -X 'main.buildDate=${BUILD_DATE}'" -mod vendor -o plugin-backend cmd/plugin-backend.go

.PHONY: build-frontend
build-frontend: install-frontend fmt-frontend
	@echo "### Building frontend"
	cd web && npm run build

.PHONY: build
build: build-backend build-frontend

.PHONY: frontend
frontend: build-frontend lint-frontend test-frontend

.PHONY: backend
backend: build-backend lint-backend test-backend

.PHONY: image
image:
	@echo "### Building image with ${OCI_BIN}"
	$(OCI_BIN) build -t $(IMAGE) .

.PHONY: build-ci-images
build-ci-images:
ifeq ($(TAG), main)
# Also tag "latest" only for branch "main"
	$(OCI_BIN) build -t $(IMAGE) -t $(BASE_IMAGE):latest .
else
	$(OCI_BIN) build -t $(IMAGE) .
endif
	$(OCI_BIN) build --build-arg BASE_IMAGE=$(IMAGE) -t $(BASE_IMAGE):$(BUILD_SHA) -f shortlived.Dockerfile .

.PHONY: push
push:
	$(OCI_BIN) push $(IMAGE)

.PHONY: serve
serve:
	./plugin-backend

.PHONY: start
start: build-backend 
	@echo "### Starting backend on http://localhost:9002"
	bash -c "trap 'fuser -k 9002/tcp' EXIT; \
					./plugin-backend -port 9002 & cd web && npm run start" 

.PHONY: bridge
bridge:
ifeq (,${CONSOLE})
	@echo "CONSOLE must be set to your local path of the console repository clone. E.g. CONSOLE=/path/to/console make bridge"
else
	@echo "### Setting bridge from ${CONSOLE} to http://localhost:9000/netflow-traffic"
	cd ${CONSOLE} && source contrib/oc-environment.sh && ./bin/bridge -plugins network-observability-plugin=http://localhost:9001/ --plugin-proxy='{"services":[{"consoleAPIPath":"/api/proxy/plugin/network-observability-plugin/backend/","endpoint":"http://localhost:9001"}]}'
	cd -
endif
