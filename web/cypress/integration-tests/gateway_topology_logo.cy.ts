import { netflowPage, setupTopologyViewWithNamespaceFilter, topologyPage, topologySelectors } from "@views/netflow-page"
import { Operator } from "@views/netobserv"
import { verifyResourceSVGLogo } from "@views/netobserv-logo"

describe("(OCP-87215, Network_Observability) Verify Gateway API three-level owner metadata UI Test\t", function () {
    const gatewayNS = 'netobserv-gateway-test'
    const gatewayName = 'test-gateway-owner'
    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector("FlowRTT")

        // Deploy all Gateway API resources from combined template (includes namespace creation and traffic generator)
        cy.adminCLI(`oc process -f cypress/fixtures/gateway-api-template.yaml \
            | oc apply -f -`)
    })

    beforeEach("navigate to topology view", function () {
        setupTopologyViewWithNamespaceFilter(gatewayNS)
    })

    it("(OCP-87215, kapjain, Network_Observability) should verify Gateway appears as owner-level topology node with logo", function () {

        topologyPage.selectScopeGroup("owner", null)
        topologyPage.isViewRendered()

        // Verify topology is rendered
        cy.get('[data-surface="true"]').should('exist')

        // Verify nodes exist in the topology
        cy.get(topologySelectors.node, { timeout: 60000 }).should('have.length.greaterThan', 0)

        // Search for Gateway in topology
        cy.byTestID('search-topology-element-input').should('exist').clear().type(gatewayName)

        // Verify Gateway node exists and is visible
        cy.get(`g[data-id*="o=Gateway.${gatewayName}"]`, { timeout: 90000 }).should('exist')

        // Validate Gateway SVG icon/logo dynamically
        verifyResourceSVGLogo('Gateway', gatewayName, 60000)
    })

    afterEach("test", function () {
        netflowPage.clearAllFilters()
    })

    after("cleanup Gateway resources", function () {
        // Delete traffic generator deployment
        cy.adminCLI(`oc process -f cypress/fixtures/gateway-api-template.yaml \
            | oc delete -f -`, { failOnNonZeroExit: false })
        // Remove cluster admin role
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
