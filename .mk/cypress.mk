##@ Cypress
.PHONY: cypress
cypress: ## Open cypress UI
	@echo "### Opening cypress"
	cd web && npm run cypress:open

.PHONY: cypress-run-standalone-mock
cypress-run-standalone-mock: build-backend build-frontend-standalone ## Run frontend e2e using cypress
	@echo "### Running cypress using standalone mocks"
	$(MAKE) serve-mock & (cd web && npm run cypress:run)
	-killall -9 plugin-backend

.PHONY: cypress-image-build
cypress-image-build: ## Build cypress e2e image
	$(OCI_BIN) build --load --build-arg LDFLAGS="${LDFLAGS}" --build-arg BUILDSCRIPT=:standalone -t ${IMAGE}-cypress -f Dockerfile.cypress .

.PHONY: cypress-image-run
cypress-image-run: ## Run cypress e2e image
	echo 'running image ${IMAGE}-cypress'; \
	$(OCI_BIN) run ${IMAGE}-cypress

.PHONY: cypress-image-push
cypress-image-push: ## Push cypress e2e image
	echo 'pushing image ${IMAGE}-cypress'; \
	$(OCI_BIN) push ${IMAGE}-cypress