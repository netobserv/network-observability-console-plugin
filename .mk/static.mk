##@ Static

.PHONY: build-frontend-static
build-frontend-static: install-frontend fmt-frontend ## Run npm install, format and build static frontend
	@echo "### Building static frontend"
	cd web && npm run build:static