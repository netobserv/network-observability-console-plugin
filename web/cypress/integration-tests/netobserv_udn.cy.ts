import { colSelectors, filterSelectors, netflowPage, setupTopologyViewWithNamespaceFilter, topologyPage, topologySelectors } from "@views/netflow-page"
import { Operator } from "@views/netobserv"
describe('(OCP-81751 Network_Observability) UDN test', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector("UDNMapping")

        // deploy UDN and CUDN
        cy.adminCLI('oc create -f cypress/fixtures/test-udn.yaml')
    })

    beforeEach('any UDN test', function () {
        netflowPage.visit()
    })

    it("(OCP-81751, aramesha) should verify default Network Name columns", function () {
        cy.get('#tabs-container li:nth-child(2)').click()
        cy.byTestID("table-composable").should('exist')
        netflowPage.stopAutoRefresh()

        // verify default Destination and Source Network Name columns
        cy.byTestID('table-composable').should('exist').within(() => {
            cy.get(colSelectors.dstNetworkName).should('exist')
            cy.get(colSelectors.srcNetworkName).should('exist')
        })
    })

    it("(OCP-81751, aramesha) should verify network scope", function () {
        setupTopologyViewWithNamespaceFilter()

        const scope = 'network'
        topologyPage.selectScopeGroup(scope, null)
        topologyPage.isViewRendered()

        // Filter on empty CUDN
        cy.get(filterSelectors.filterInput).type("udns=netobserv-cudn-81751" + '{enter}')
        cy.get('#drawer', { timeout: 60000 }).contains('No results found')

        // Check Show empty checkbox and filter on empty UDN
        netflowPage.clearAllFilters()
        cy.contains('Display options').should('exist').click()
        cy.get(topologySelectors.emptyToggle).check()

        cy.get(filterSelectors.filterInput).type("udns=netobserv-cudn-81751" + '{enter}')
        cy.get('#drawer').should('not.be.empty')
        netflowPage.clearAllFilters()
    })

    afterEach("test", function () {
        netflowPage.resetClearFilters()
    })

    after("all tests", function () {
        cy.adminCLI('oc delete -f cypress/fixtures/test-udn.yaml')
        Operator.deleteFlowCollector()
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
