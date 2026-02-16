import { netflowPage } from "@views/netflow-page"
import { Operator } from "@views/netobserv"

describe('(OCP-74049, OCP-73875 Network_Observability) Prometheus datasource only', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        Operator.createFlowcollector("LokiDisabled")
    })

    it('(OCP-74049, aramesha, Network_Observability), Verify Prom dataSource in Administrator view as cluster-admin user', function () {
        netflowPage.visit()

        cy.checkNetflowTraffic("Disabled")

        // verify only prom and auto dataSource is enabled in query options
        cy.get('#filter-toolbar-search-filters').contains('Query options').click();
        cy.get('#query-options-dropdown').click();
        cy.get('#dataSource-loki').should('be.disabled')
        cy.get('#dataSource-prom').should('not.be.disabled')
        cy.get('#dataSource-auto').should('not.be.disabled')
        cy.get('#filter-toolbar-search-filters').contains('Query options').click();

        // verify resource scope is not observed with prom dataSource
        cy.byTestID("show-view-options-button").should('exist').click().then(views => {
            cy.contains('Display options').should('exist').click()
            // set one display to test with
            cy.byTestID('scope-dropdown').click()
            cy.byTestID('resource').should('not.exist')
        })
    })
    after("after all tests are done", function () {
        // Delete flowcollector
        cy.adminCLI(`oc delete flowcollector cluster`)
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
