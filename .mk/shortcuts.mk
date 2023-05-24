##@ shortcuts helpers
.PHONY: fmt
fmt: fmt-backend fmt-frontend ## Fmt all

.PHONY: lint
lint: lint-backend lint-frontend ## Lint all

.PHONY: test
test: test-backend test-frontend ## Test all

.PHONY: i18n
i18n: ## Run frontend i18n
	@echo "### generating frontend locales"
	cd web && npm run i18n

.PHONY: build-frontend
build-frontend: install-frontend fmt-frontend just-build-frontend ## Run npm install, format and build frontend

.PHONY: build
build: build-backend build-frontend ## Build all

.PHONY: build-standalone
build-standalone: build-backend build-frontend-standalone ## Build all as standalone

.PHONY: frontend
frontend: build-frontend lint-frontend test-frontend ## Build lint and test frontend

.PHONY: backend
backend: build-backend lint-backend test-backend ## Build lint and test backend

.PHONY: build-image
build-image: image-build ## Build MULTIARCH_TARGETS images

.PHONY: push-image
push-image: image-push ## Push MULTIARCH_TARGETS images

.PHONY: build-manifest
build-manifest: manifest-build ## Build MULTIARCH_TARGETS manifest

.PHONY: push-manifest
push-manifest: manifest-push ## Push MULTIARCH_TARGETS manifest

.PHONY: images
images: image-build image-push manifest-build manifest-push ## Build and push MULTIARCH_TARGETS images and related manifest
