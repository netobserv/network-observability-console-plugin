import { Operator } from "@views/netobserv"
import { netflowPage, overviewSelectors, querySumSelectors, colSelectors } from "@views/netflow-page"

describe('(OCP-68246 Network_Observability) FlowRTT test', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector("FlowRTT")
    })

    beforeEach('any flowRTT test', function () {
        netflowPage.visit()
    })

    it("(OCP-68246, aramesha, Network_Observability) Verify flowRTT panels", function () {
        // to reduce flakes restore default panels first time it comes to overview page
        cy.openPanelsModal();
        cy.get(overviewSelectors.panelsModal).contains('Restore default panels').click();
        cy.get(overviewSelectors.panelsModal).contains('Save').click();
        netflowPage.waitForLokiQuery()

        // verify Query Summary stats for flowRTT
        cy.get(querySumSelectors.avgRTT).should('exist').then(avgRTT => {
            cy.checkQuerySummary(avgRTT)
        })

        // verify default flowRTT panels are visible
        cy.checkPanel(overviewSelectors.defaultFlowRTTPanels)
        cy.checkPanelsNum(5);

        // verify all relevant panels are listed
        cy.openPanelsModal()
        cy.checkPopupItems(overviewSelectors.panelsModal, overviewSelectors.manageFlowRTTPanelsList);

        // select all panels and verify they are rendered
        cy.get(overviewSelectors.panelsModal).contains('Select all').click();
        cy.get(overviewSelectors.panelsModal).contains('Save').click();
        netflowPage.waitForLokiQuery()
        cy.checkPanelsNum(9);

        netflowPage.waitForLokiQuery()
        cy.checkPanel(overviewSelectors.allFlowRTTPanels)
    })

    it("(OCP-68246, aramesha, Network_Observability) Verify default flowRTT column", function () {
        cy.get('#tabs-container li:nth-child(2)').click()
        cy.byTestID("table-composable").should('exist')
        netflowPage.stopAutoRefresh()

        // verify default FowRTT column
        cy.byTestID('table-composable').should('exist').within(() => {
            cy.get(colSelectors.flowRTT).should('exist')
        })
    })

    afterEach("test", function () {
        netflowPage.resetClearFilters()
    })

    after("Delete flowcollector", function () {
        Operator.deleteFlowCollector()
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
