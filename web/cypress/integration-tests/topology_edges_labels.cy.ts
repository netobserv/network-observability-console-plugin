import { netflowPage, topologySelectors, topologyPage, setupTopologyViewWithNamespaceFilter } from "@views/netflow-page"
import { Operator, project } from "@views/netobserv"

function getTopologyResourceScopeGroupURL(groups: string): string {
    return `**/flow/metrics**groups=${groups}*`
}

describe("(OCP-53591 Network_Observability) Netflow Topology edges,labels, badges features", { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector()
    })

    beforeEach("run before each test", function () {
        setupTopologyViewWithNamespaceFilter()

        // advance options menu remains visible throughout the test
        topologyPage.selectScopeGroup("resource", "owners")
        cy.contains('Display options').should('exist').click()
    })

    it("(OCP-53591, memodi, Network_Observability) should verify group owners", function () {
        cy.intercept(getTopologyResourceScopeGroupURL('owners'), { fixture: 'flowmetrics/Owners.json' })
        cy.get(topologySelectors.nGroups).its('length').should('be.greaterThan', 30)
    })

    it("(OCP-53591, memodi, Network_Observability) should verify group expand/collapse", function () {
        cy.get(topologySelectors.groupToggle).click()
        cy.get(topologySelectors.groupLayer + ' > ' + topologySelectors.group).each((node, index) => {
            cy.wrap(node).should('not.have.descendants', 'g.pf-topology__group')
        })
        cy.get(topologySelectors.groupToggle).click()
        cy.get(topologySelectors.groupLayer + ' > ' + topologySelectors.group).each((node, index) => {
            cy.wrap(node).should('have.descendants', 'g.pf-topology__group')
        })
    })

    it("(OCP-53591, memodi, Network_Observability) should verify edges display/hidden", function () {
        cy.get(topologySelectors.edgeToggle).uncheck()

        // verify labels are also hidden
        cy.get('#edges-tag-switch').should('be.disabled')
        cy.get(topologySelectors.defaultLayer).each((node, index) => {
            cy.wrap(node).should('not.have.descendants', '' + topologySelectors.edge)
        })
        cy.get(topologySelectors.edgeToggle).check()
        cy.get('#edges-tag-switch').should('be.enabled')
        cy.get(topologySelectors.defaultLayer).each((node, index) => {
            cy.wrap(node).should('have.descendants', '' + topologySelectors.edge)
        })
    })

    it("(OCP-53591, memodi, Network_Observability) should verify edges labels can be displayed/hidden", function () {
        netflowPage.selectSourceNS(project)
        topologyPage.selectScopeGroup(null, "none")
        topologyPage.selectScopeGroup("namespace", null)
        cy.get('#reset-view').should('exist').click()
        cy.get('[data-test-id="edge-handler"] g.pf-topology__edge__tag').should("exist")


        cy.contains('Display options').should('exist').click()
        cy.get(topologySelectors.labelToggle).uncheck()

        cy.get('[data-test-id="edge-handler"] g.pf-topology__edge__tag').should("not.exist")

        cy.get(topologySelectors.labelToggle).check()
        cy.get('[data-test-id="edge-handler"] g.pf-topology__edge__tag').should("exist")
        netflowPage.clearAllFilters()
    })

    it("(OCP-53591, memodi, Network_Observability) should verify badges display/hidden", function () {
        netflowPage.selectSourceNS(project)
        topologyPage.selectScopeGroup(null, "none")
        topologyPage.selectScopeGroup("namespace", null)
        cy.get('#reset-view').should('exist').click()

        cy.contains('Display options').should('exist').click()
        cy.get(topologySelectors.badgeToggle).uncheck()

        cy.get('g.pf-topology__node__label').each((node, index) => {
            cy.wrap(node).should('not.have.descendants', 'g.pf-topology__node__label__badge')
        })
        // not checking the existence of the badge since there may be an 
        // "Unknown" node present with empty badge.
        netflowPage.clearAllFilters()
    })

    afterEach("after each tests", function () {
        cy.contains('Display options').should('exist').click()
        netflowPage.resetClearFilters()
    })

    after("after all tests are done", function () {
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
