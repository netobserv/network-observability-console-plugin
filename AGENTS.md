# AI Agents Best Practices for Network Observability Console Plugin

Best practices for AI coding agents on NetObserv Console Plugin.

> **Note**: Symlinked as [CLAUDE.md](CLAUDE.md) for Claude Code auto-loading.

## Project Context

**NetObserv Console Plugin** - OpenShift Console dynamic plugin for network observability visualization and configuration

**Architecture:**
- **Frontend**: TypeScript/React with PatternFly components (OpenShift Console dynamic plugin SDK)
- **Backend**: Go HTTP server providing API endpoints for Loki queries, Kubernetes resources, and Prometheus metrics
- **Data Sources**: Loki (flow logs), Prometheus (metrics), Kubernetes API (metadata enrichment)
- **Deployment**: Can run as OpenShift Console plugin or standalone application

**Key Components:**
- **Topology View**: Network topology visualization with health integration
- **Traffic Flow Table**: Detailed flow records with filtering and grouping
- **Metrics Dashboard**: Network metrics and statistics
- **FlowCollector Forms**: GUI-based configuration for NetObserv resources
- **Export Capabilities**: Flow data export and visualization

**Key Directories:**
- `web/src/`: Frontend TypeScript/React code
  - `components/`: React components (forms, tables, topology, etc.)
  - `api/`: API client code for Loki, Kubernetes, Prometheus
  - `model/`: Data models and transformations
  - `utils/`: Utility functions
- `pkg/`: Backend Go code
  - `handler/`: HTTP request handlers
  - `loki/`: Loki client and query builders
  - `kubernetes/`: Kubernetes API client
  - `prometheus/`: Prometheus client
  - `config/`: Configuration management
- `web/cypress/`: Cypress integration tests
- `config/`: Kubernetes manifests for deployment

## Critical Constraints

### 🚨 OpenShift Console Plugin SDK Compatibility
This is a dynamic plugin for OpenShift Console:
- Must use `@openshift-console/dynamic-plugin-sdk` APIs
- Follow OpenShift Console conventions for navigation, extensions, and theming
- Use PatternFly components for UI consistency

### 🚨 Backward Compatibility
Frontend configuration schemas must remain compatible:
- ✅ Add optional fields with defaults
- ❌ Never remove/rename fields in schemas or API responses
- Changes to `uiSchema.ts` must preserve existing field behaviors

### 🚨 Schema Synchronization
When updating FlowCollector CRD-related code:
1. Update `web/src/components/forms/config/uiSchema.ts` for form display rules
2. Update wizard files (e.g., `web/src/components/forms/flowCollector-wizard.tsx`)
3. Regenerate schemas: `./scripts/generate-schemas.sh` (requires running cluster with CRDs)

### 🚨 Multi-Mode Support
Support both deployment modes:
- **Plugin Mode**: Integrated with OpenShift Console
- **Standalone Mode**: Independent web application with mocked data

### 🚨 Node/npm Version Consistency
Node.js and npm versions matter:
- Use versions specified in `Dockerfile` (check for exact versions)
- Use `nvm` to manage node/npm versions
- Even patch version mismatches can break builds

### 🚨 Loki Query Optimization
Loki queries can be expensive:
- Use appropriate time ranges and limits
- Leverage caching where possible
- Consider query complexity and cardinality
- Test queries with realistic data volumes

## Effective Prompting

**Good Example:**
```
Update web/src/components/netflow-traffic/netflow-traffic-table.tsx to add a new
column for packet loss percentage. Add corresponding field to
web/src/api/loki/decoder.ts for parsing from Loki responses. Include unit tests
in web/src/__tests__/.
```

**Bad Example:**
```
Add packet loss column
```

**Key Principles:**
1. Specify file paths explicitly (web/src vs pkg)
2. Distinguish frontend (TypeScript) vs backend (Go) changes
3. Reference existing patterns in similar components
4. Mention testing requirements (Jest for frontend, Go tests for backend)
5. Consider both plugin and standalone modes

## Common Task Templates

### Add Frontend Component Feature
```
Add DNS lookup tooltip to web/src/components/netflow-traffic/netflow-traffic-table.tsx:
1. Update component to fetch DNS data from backend API
2. Add tooltip using PatternFly Tooltip component
3. Handle loading and error states
4. Add Jest tests in web/src/__tests__/
5. Test in both plugin and standalone modes
```

### Add Backend API Endpoint
```
Add new endpoint to pkg/handler/ for querying top talkers:
1. Create handler function following existing patterns in pkg/handler/
2. Add Loki query builder in pkg/loki/
3. Add response model in pkg/model/
4. Register route in pkg/server/
5. Add Go unit tests
6. Update frontend API client in web/src/api/
```

### Update FlowCollector Forms
```
Add new field spec.processor.kafkaConsumerReplicas to FlowCollector form:
1. Update web/src/components/forms/config/uiSchema.ts with field definition
2. Add field to web/src/components/forms/flowCollector-wizard.tsx if needed
3. Update web/moduleMapper/schemas.ts via ./scripts/generate-schemas.sh
4. Test form validation and defaults
5. Verify both advanced and wizard modes
```

### Add Topology Feature
```
Add edge bundling to topology view in web/src/components/netflow-topology/:
1. Update topology component with new visualization option
2. Add toggle control in topology toolbar
3. Store preference in component state/URL params
4. Add tests for edge bundling logic
5. Verify performance with large graphs
```

### Update Loki Query Logic
```
Optimize query for namespace filtering in pkg/loki/query_builder.go:
1. Add namespace label filter to LogQL query
2. Update query builder tests in pkg/loki/
3. Verify query performance with Loki
4. Update frontend to pass namespace filters
5. Add integration test scenario
```

### Add Cypress Test
```
Add Cypress test for export functionality:
1. Create test file in web/cypress/integration/
2. Test export button interaction
3. Verify downloaded file format
4. Test with different filter combinations
5. Run: make cypress
```

## Code Review Checklist

```
Frontend (TypeScript/React):
1. PatternFly component usage consistency
2. TypeScript type safety (avoid 'any')
3. React hooks best practices (useCallback, useMemo)
4. Error handling and loading states
5. Accessibility (ARIA labels, keyboard navigation)
6. i18n strings (use react-i18next)
7. Jest test coverage
8. Console plugin SDK API usage
9. Both plugin and standalone modes work

Backend (Go):
1. Error handling (wrap with context)
2. Logging with appropriate levels
3. Unit test coverage
4. Loki query efficiency
5. API response models
6. HTTP status codes
7. Resource cleanup (defer close)
8. Security (input validation, CORS)
```

## Testing

### Frontend Tests
```
Add Jest tests for new component in web/src/components/mycomponent/:
- Render behavior with different props
- User interactions (clicks, inputs)
- API call mocking
- Error states
- Edge cases (empty data, null values)
Run: make test-frontend or cd web && npm test
```

### Backend Tests
```
Add Go tests for pkg/loki/query_builder.go:
- Valid query construction
- Invalid input handling
- Edge cases (empty filters, nil params)
- Mock Loki responses
Run: make test-backend or go test ./pkg/...
```

### Integration Tests (Cypress)
```
Test complete user flows:
1. Start dev environment: make serve (in one terminal)
2. Start OpenShift Console bridge: CONSOLE=/path/to/console make bridge
3. Port-forward Loki: oc port-forward service/loki 3100:3100
4. Run Cypress: make cypress
5. Click "Run N integration specs"

For standalone mode:
1. make serve-mock (or make start-standalone with Loki)
2. Update web/cypress/support/const.js URL to http://localhost:9001
3. make cypress
```

### Local Development Testing
```
Test plugin integration locally:
1. Build frontend: make build-frontend
2. Start backend: make serve
3. Start console: CONSOLE=/path/to/console make bridge
4. Navigate to http://localhost:9000/netflow-traffic
5. Verify functionality with real Loki data
```

## Repository-Specific Context

### Frontend Architecture
- **State Management**: React hooks (useState, useContext), no Redux
- **Styling**: PatternFly CSS-in-JS and stylesheets
- **Routing**: React Router v5
- **API Calls**: Axios with custom clients
- **Forms**: React JSON Schema Form (@rjsf/core) for FlowCollector
- **Charts**: PatternFly React Charts (based on Victory)
- **Topology**: PatternFly React Topology

### Backend Architecture
- **HTTP Server**: Custom Go HTTP server (not Gin/Echo)
- **Loki Client**: Custom LogQL query builder
- **Kubernetes**: client-go for API access
- **Configuration**: Environment variables and ConfigMaps
- **Metrics**: Prometheus client for instrumentation

### Schema Management
Two types of schemas:
- **CRD Schemas**: Generated from operator CRDs via `./scripts/generate-schemas.sh`
  - Used in `web/moduleMapper/schemas.ts`
  - Required for standalone mode and form validation
- **UI Schemas**: Hand-maintained in `web/src/components/forms/config/uiSchema.ts`
  - Define field display rules, dependencies, visibility
  - Drive form rendering behavior

### Configuration Files
Static configuration embedded at build time:
- Frontend config: Webpack, TypeScript, Jest configurations in `web/`
- Backend config: Go modules, Dockerfiles
- Console plugin metadata: `web/package.json` consolePlugin section

### Build Optimization
- **Production builds**: `make build` (optimized, slower)
- **Development builds**: `BUILDSCRIPT=:dev make build` (faster, unoptimized)
- **Frontend only**: `make frontend` (build+lint+test)
- **Backend only**: `make backend` (build+lint+test)

### Deployment Modes
1. **OpenShift Console Plugin**:
   - Deployed via NetObserv Operator
   - Integrated into OpenShift Console navigation
   - Full feature set with Console integration

2. **Standalone Mode**:
   - Independent web application
   - Single page showing traffic view
   - Can use mocked data or real Loki
   - Build: `STANDALONE=true make images`

### Data Flow
```
User Action (Frontend)
  ↓
React Component
  ↓
API Client (web/src/api/)
  ↓
Backend Handler (pkg/handler/)
  ↓
Loki/Prometheus/K8s Client (pkg/)
  ↓
External Service (Loki, K8s API, etc.)
```

## Quick Reference

**Essential Commands:**
```bash
make install-frontend              # First-time setup
make build                         # Build backend and frontend
make lint test                     # Lint and test all
make frontend                      # Build+lint+test frontend only
make backend                       # Build+lint+test backend only
make serve                         # Serve plugin locally
CONSOLE=/path/to/console make bridge  # Start OpenShift Console
make cypress                       # Run Cypress tests
make image-build image-push        # Build and push container image
make serve-mock                    # Standalone mode with mocked data
```

**Quick Development Builds:**
```bash
BUILDSCRIPT=:dev make frontend     # Fast frontend build
BUILDSCRIPT=:dev make images       # Fast image build
```

**Key Files:**
- Frontend Components: [web/src/components/](web/src/components/)
  - Traffic Table: [web/src/components/netflow-traffic/netflow-traffic-table.tsx](web/src/components/netflow-traffic/netflow-traffic-table.tsx)
  - Topology: [web/src/components/netflow-topology/](web/src/components/netflow-topology/)
  - Forms: [web/src/components/forms/](web/src/components/forms/)
- UI Schema: [web/src/components/forms/config/uiSchema.ts](web/src/components/forms/config/uiSchema.ts)
- Backend Handlers: [pkg/handler/](pkg/handler/)
- Loki Client: [pkg/loki/](pkg/loki/)
- API Models: [pkg/model/](pkg/model/)
- Cypress Tests: [web/cypress/integration/](web/cypress/integration/)
- Webpack Config: [web/webpack.config.ts](web/webpack.config.ts)

**Version Requirements:**
- Check [Dockerfile](Dockerfile) for Node.js, npm, and Go versions
- Use `nvm` for Node.js version management
- PatternFly v5 (check web/package.json)

## AI Workflow Example

```
1. Research: "Explain how topology health data is integrated"
2. Plan: "Add packet drop visualization to topology - suggest changes"
3. Implement: "Implement with color coding and tooltips"
4. Review: "Review for accessibility and performance"
5. Test: "Add Jest tests and Cypress scenario"
6. Verify: "Test in both plugin and standalone modes"
```

## Contribution Checklist

Before commit:
1. AI code review
2. `make lint test` (both frontend and backend)
3. Test in dev environment (`make serve` + console bridge)
4. Test standalone mode if changes affect it
5. Update schemas if FlowCollector-related changes
6. Run Cypress tests for UI changes
7. Conventional commit messages

## Common Pitfalls

**Frontend:**
- Using `any` type instead of proper TypeScript types
- Not handling loading/error states in components
- Breaking OpenShift Console plugin API compatibility
- Forgetting to test standalone mode
- Not wrapping strings in i18n (react-i18next)
- Incorrect PatternFly component usage

**Backend:**
- Not closing HTTP response bodies or file handles
- Missing error context in logs
- Inefficient Loki queries (too broad time ranges, no limits)
- Not validating user inputs
- Hardcoding values instead of using configuration

**General:**
- Using wrong node/npm versions (breaks builds)
- Not updating schemas after CRD changes
- Breaking changes to API response formats
- Not testing both deployment modes
- Missing test coverage for edge cases

## Resources

- [README.md](README.md) - Setup, build, test, deploy
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [OpenShift Console Dynamic Plugin SDK](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)
- [PatternFly React](https://www.patternfly.org/v4/get-started/develop)
- [NetObserv Operator](https://github.com/netobserv/network-observability-operator) - Deploys this plugin

**Remember**: AI agents need clear context. Always review generated code, test
thoroughly in both plugin and standalone modes, and follow project conventions.
