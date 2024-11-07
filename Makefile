# VERSION defines the project version for the bundle.
# Update this value when you upgrade the version of your project.
# To re-generate a bundle for another specific version without changing the standard setup, you can:
# - use the VERSION as arg of the bundle target (e.g make bundle VERSION=0.0.2)
# - use environment variables to overwrite this value (e.g export VERSION=0.0.2)
VERSION ?= main
BUILD_DATE := $(shell date +%Y-%m-%d\ %H:%M)
TAG_COMMIT := $(shell git rev-list --abbrev-commit --tags --max-count=1)
TAG := $(shell git describe --abbrev=0 --tags ${TAG_COMMIT} 2>/dev/null || true)
BUILD_SHA := $(shell git rev-parse --short HEAD)
BUILD_VERSION := $(TAG:v%=%)
ifneq ($(COMMIT), $(TAG_COMMIT))
	BUILD_VERSION := $(BUILD_VERSION)-$(BUILD_SHA)
endif
ifneq ($(shell git status --porcelain),)
	BUILD_VERSION := $(BUILD_VERSION)-dirty
endif

# Go architecture and targets images to build
GOARCH ?= amd64
MULTIARCH_TARGETS ?= amd64

# Setting SHELL to bash allows bash commands to be executed by recipes.
SHELL := /usr/bin/env bash

# In CI, to be replaced by `netobserv`
IMAGE_ORG ?= $(USER)

# IMAGE_TAG_BASE defines the namespace and part of the image name for remote images.
IMAGE_TAG_BASE ?= quay.io/${IMAGE_ORG}/network-observability-console-plugin

# Standalone `true` is used to build frontend outside of OCP Console environment
# see .mk/standalone.mk
STANDALONE ?= false

ifeq (${STANDALONE}, true)
	BUILDSCRIPT = :standalone
	IMAGE_TAG_BASE := quay.io/${IMAGE_ORG}/network-observability-standalone-frontend
endif

# Image URL to use all building/pushing image targets
IMAGE ?= ${IMAGE_TAG_BASE}:${VERSION}

OCI_BUILD_OPTS ?=

# Image building tool (docker / podman) - docker is preferred in CI
OCI_BIN_PATH = $(shell which docker 2>/dev/null || which podman)
OCI_BIN ?= $(shell basename ${OCI_BIN_PATH})

GOLANGCI_LINT_VERSION = v1.53.3
NPM_INSTALL ?= install
CMDLINE_ARGS ?= --loglevel trace --config config/config.yaml
LDFLAGS := -X 'main.buildVersion=${BUILD_VERSION}' -X 'main.buildDate=${BUILD_DATE}'
# You can add GO Build flags like -gcflags=all="-N -l" here to remove optimizations for debugging
BUILD_FLAGS ?= -ldflags "${LDFLAGS}"

.DEFAULT_GOAL := help

# build a single arch target provided as argument
define build_target
	echo 'building image for arch $(1)'; \
	DOCKER_BUILDKIT=1 $(OCI_BIN) buildx build --ulimit nofile=20480:20480 --load --build-arg LDFLAGS="${LDFLAGS}" --build-arg BUILDSCRIPT=${BUILDSCRIPT} --build-arg TARGETARCH=$(1) ${OCI_BUILD_OPTS} -t ${IMAGE}-$(1) -f Dockerfile .;
endef

# push a single arch target image
define push_target
	echo 'pushing image ${IMAGE}-$(1)'; \
	DOCKER_BUILDKIT=1 $(OCI_BIN) push ${IMAGE}-$(1);
endef

# manifest create a single arch target provided as argument
define manifest_add_target
	echo 'manifest add target $(1)'; \
	DOCKER_BUILDKIT=1 $(OCI_BIN) manifest add ${IMAGE} ${IMAGE}-$(target);
endef

##@ General

# The help target prints out all targets with their descriptions organized
# beneath their categories. The categories are represented by '##@' and the
# target descriptions by '##'. The awk commands is responsible for reading the
# entire set of makefiles included in this invocation, looking for lines of the
# file as xyz: ## something, and then pretty-format the target and help. Then,
# if there's a line with ##@ something, that gets pretty-printed as a category.
# More info on the usage of ANSI control characters for terminal formatting:
# https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
# More info on the awk command:
# http://linuxcommand.org/lc3_adv_awk.php

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: prereqs
prereqs: ## Test if prerequisites are met, and installing missing dependencies
	@echo "### Test if prerequisites are met, and installing missing dependencies"
	GOFLAGS="" go install github.com/golangci/golangci-lint/cmd/golangci-lint@${GOLANGCI_LINT_VERSION}

.PHONY: vendors
vendors: ## Check go vendors
	@echo "### Checking vendors"
	go mod tidy && go mod vendor

.PHONY: yq
YQ = ./bin/yq
YQ: ## Download yq locally if necessary.
ifeq (,$(shell which $(YQ) 2>/dev/null))
	@{ \
	echo "### Downloading yq"; \
	set -e ;\
	mkdir -p $(dir $(YQ)) ;\
	OS=$(shell go env GOOS) && ARCH=$(shell go env GOARCH) && \
	curl -sSLo $(YQ) https://github.com/mikefarah/yq/releases/download/v4.35.2/yq_$${OS}_$${ARCH} ;\
	chmod +x $(YQ) ;\
	}
endif

##@ Develop

.PHONY: start
start: YQ build-backend install-frontend ## Run backend and frontend
	$(YQ) '.server.port |= 9002 | .server.metricsPort |= 9003 | .loki.useMocks |= false' ./config/sample-config.yaml > ./config/config.yaml
	@echo "### Starting backend on http://localhost:9002"
	bash -c "trap 'fuser -k 9002/tcp' EXIT; \
					./plugin-backend $(CMDLINE_ARGS) & cd web && npm run start"

.PHONY: start-backend
start-backend: YQ build-backend
	$(YQ) '.server.port |= 9002 | .server.metricsPort |= 9003 | .loki.useMocks |= false' ./config/sample-config.yaml > ./config/config.yaml
	bash -c "trap 'fuser -k 9002/tcp' EXIT; \
					./plugin-backend $(CMDLINE_ARGS)"

.PHONY: bridge
bridge: ## Bridge OCP console
ifeq (,${CONSOLE})
	@echo "CONSOLE must be set to your local path of the console repository clone. E.g. CONSOLE=/path/to/console make bridge"
else
	@echo "### Setting bridge from ${CONSOLE} to http://localhost:9000/netflow-traffic"
	cd ${CONSOLE} && source contrib/oc-environment.sh && ./bin/bridge -plugins netobserv-plugin=http://localhost:9001/ --plugin-proxy='{"services":[{"consoleAPIPath":"/api/proxy/plugin/netobserv-plugin/backend/","endpoint":"http://localhost:9001"}]}'
	cd -
endif

.PHONY: generate-doc
generate-doc: ## Generate documentation of the flows JSON format
	cd web && npm run generate-doc

##@ Develop frontend

.PHONY: install-frontend
install-frontend: ## Run frontend npm install
	@echo "### Installing frontend dependencies"
	cd web && npm ${NPM_INSTALL}

.PHONY: fmt-frontend
fmt-frontend: i18n ## Run frontend i18n and fmt
	cd web && npm run format-all

.PHONY: lint-frontend
lint-frontend: ## Lint frontend code
	@echo "### Linting frontend code"
	cd web && npm run lint

.PHONY: test-frontend
test-frontend: ## Test frontend using jest
	@echo "### Testing frontend"
	cd web && npm run test

##@ Develop backend

.PHONY: build-backend
build-backend: fmt-backend ## Build backend
	@echo "### Building backend"
	GOARCH=${GOARCH} go build ${BUILD_FLAGS} -mod vendor -o plugin-backend cmd/plugin-backend.go

.PHONY: fmt-backend
fmt-backend: ## Run backend go fmt
	go fmt ./...

.PHONY: lint-backend
lint-backend: prereqs ## Lint backend code
	@echo "### Linting backend code"
	golangci-lint run ./...

.PHONY: test-backend
test-backend: ## Test backend using go test
	@echo "### Testing backend"
	go test ./... -coverpkg=./... -coverprofile cover.out

.PHONY: serve
serve: YQ ## Run backend
	$(YQ) '.server.port |= 9001 | .server.metricsPort |= 9002 | .loki.useMocks |= false' ./config/sample-config.yaml > ./config/config.yaml
	./plugin-backend $(CMDLINE_ARGS)

.PHONY: serve-mock
serve-mock: YQ ## Run backend using mocks
	$(YQ) '.server.port |= 9001 | .server.metricsPort |= 9002 | .loki.useMocks |= true' ./config/sample-config.yaml > ./config/config.yaml
	./plugin-backend $(CMDLINE_ARGS)

##@ Images

# note: to build and push custom image tag use: IMAGE_ORG=myuser VERSION=dev make images
.PHONY: image-build
image-build: ## Build MULTIARCH_TARGETS images
	trap 'exit' INT; \
	$(foreach target,$(MULTIARCH_TARGETS),$(call build_target,$(target)))

.PHONY: image-push
image-push: ## Push MULTIARCH_TARGETS images
	trap 'exit' INT; \
	$(foreach target,$(MULTIARCH_TARGETS),$(call push_target,$(target)))

.PHONY: manifest-build
manifest-build: ## Build MULTIARCH_TARGETS manifest
	@echo 'building manifest $(IMAGE)'
	DOCKER_BUILDKIT=1 $(OCI_BIN) rmi ${IMAGE} -f
	DOCKER_BUILDKIT=1 $(OCI_BIN) manifest create ${IMAGE} $(foreach target,$(MULTIARCH_TARGETS), --amend ${IMAGE}-$(target));

.PHONY: manifest-push
manifest-push: ## Push MULTIARCH_TARGETS manifest
	@echo 'publish manifest $(IMAGE)'
ifeq (${OCI_BIN}, docker)
	DOCKER_BUILDKIT=1 $(OCI_BIN) manifest push ${IMAGE};
else
	DOCKER_BUILDKIT=1 $(OCI_BIN) manifest push ${IMAGE} docker://${IMAGE};
endif

include .mk/cypress.mk
include .mk/shortcuts.mk
include .mk/standalone.mk
