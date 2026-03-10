import { colSelectors, filterSelectors, netflowPage, overviewSelectors, querySumSelectors } from "@views/netflow-page"
import { Operator, project } from "@views/netobserv"

describe('(OCP-67087 Network_Observability) DNSTracking test', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector("DNSTracking")
    })

    beforeEach('any DNSTracking test', function () {
        netflowPage.visit()
    })

    it("(OCP-67087, aramesha, Network_Observability) Verify DNSTracking panels and Query Summary", function () {
        // verify default DNSTracking panels are visible
        cy.checkPanel(overviewSelectors.defaultDNSTrackingPanels)
        cy.checkPanelsNum(6);

        // open panels modal and verify all relevant panels are listed
        cy.openPanelsModal()
        cy.checkPopupItems(overviewSelectors.panelsModal, overviewSelectors.manageDNSTrackingPanelsList);

        // select all panels and verify they are rendered
        cy.get(overviewSelectors.panelsModal).contains('Select all').click();
        cy.get(overviewSelectors.panelsModal).contains('Save').click();
        netflowPage.waitForLokiQuery()
        cy.checkPanelsNum(11);

        netflowPage.waitForLokiQuery()
        cy.checkPanel(overviewSelectors.allDNSTrackingPanels)

        // restore default panels and verify they are visible
        cy.openPanelsModal();
        cy.byTestID(overviewSelectors.resetDefault).click().byTestID(overviewSelectors.save).click()
        netflowPage.waitForLokiQuery()
        cy.checkPanel(overviewSelectors.defaultDNSTrackingPanels)
        cy.checkPanelsNum(6);

        // verify Query Summary stats for DNSTracking
        cy.get(querySumSelectors.dnsAvg).should('exist').then(DNSAvg => {
            cy.checkQuerySummary(DNSAvg)
        })
    })

    it("(OCP-67087, aramesha) Validate DNSTracking columns and DNSName", function () {
        cy.get('#tabs-container li:nth-child(2)').click()
        cy.byTestID("table-composable").should('exist')
        netflowPage.stopAutoRefresh()

        // verify default DNS columns: DNS Latency and DNS Response Code
        cy.byTestID('table-composable').should('exist').within(() => {
            cy.get(colSelectors.dnsLatency).should('exist')
            cy.get(colSelectors.dnsResponseCode).should('exist')
        })

        // add filter for dst_ns=netobserv and DNSName=loki
        const dns_name = "loki.netobserv.svc.cluster"
        cy.get(filterSelectors.filterInput).type("dst_namespace=" + project + '{enter}')
        cy.get(filterSelectors.filterInput).type("dns_name=" + dns_name + '{enter}')

        // select DNS Id and DNS Error columns
        cy.openColumnsModal().then(col => {
            cy.get(colSelectors.columnsModal).should('be.visible')
            cy.get('#DNSId').check()
            cy.get('#DNSErrNo').check()
            cy.get('#DNSName').check()
            cy.byTestID(colSelectors.save).click()
        })

        // verify they are visible in table view
        cy.byTestID('table-composable').should('exist').within(() => {
            cy.get(colSelectors.dnsId).should('exist')
            cy.get(colSelectors.dnsError).should('exist')
            cy.get(colSelectors.dnsName).should('exist')
        })

        // Verify DNSName column for all rows
        cy.get('[data-test-td-column-id="DNSName"]').each((td) => {
            expect(td).to.contain(`${dns_name}`)
        })

        netflowPage.clearAllFilters()
    })

    afterEach("test", function () {
        netflowPage.resetClearFilters()
    })

    after("Delete flowcollector and DNS pods", function () {
        Operator.deleteFlowCollector()
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
