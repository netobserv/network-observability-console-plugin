##@ CI
.PHONY: ci-image-build
ci-image-build: ## Build CI image
	$(OCI_BIN) build --load --build-arg LDFLAGS="${LDFLAGS}" --build-arg -t ${IMAGE}-ci -f Dockerfile.ci .

.PHONY: ci-image-run
ci-image-run: ## Run CI image
	echo 'running image ${IMAGE}-ci'; \
	$(OCI_BIN) run ${IMAGE}-ci

.PHONY: ci-image-push
ci-image-push: ## Push CI image
	echo 'pushing image ${IMAGE}-ci'; \
	$(OCI_BIN) push ${IMAGE}-ci