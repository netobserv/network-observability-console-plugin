import { Operator, project } from "@views/netobserv"
import { netflowPage } from "@views/netflow-page"

describe('(OCP-72610 Network_Observability) Export automation', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector()
    })

    beforeEach('any export test', function () {
        netflowPage.visit()
    })

    it("(OCP-72610, aramesha, Network_Observability) should validate exporting panels", function () {
        // Export all overview panels
        cy.get('li.overviewTabButton').should('exist').click()
        netflowPage.stopAutoRefresh()
        cy.showAdvancedOptions();
        cy.get('#export-button').should('exist').click()
        cy.readFile('cypress/downloads/overview_page.png')

        // Export only Top 5 average bytes rates panel
        cy.get('#panel-kebab-top_avg_byte_rates-container > .pf-v5-c-menu-toggle').should('exist').click()
        cy.contains("Export panel").should('exist').click()
        cy.readFile('cypress/downloads/overview_panel_top_avg_byte_rates.png')
        cy.exec('rm cypress/downloads/overview_page.png')
        cy.exec('rm cypress/downloads/overview_panel_top_avg_byte_rates.png')
    })

    it("(OCP-72610, aramesha, Network_Observability) should validate exporting table view", function () {
        cy.get('li.tableTabButton').should('exist').click()
        netflowPage.stopAutoRefresh()
        netflowPage.selectSourceNS(project)
        cy.byTestID("table-composable").should('exist')
        cy.showAdvancedOptions();
        cy.get('#export-button').should('exist').click()
        cy.get('.footer > [data-test="export-button"]').should('exist').then((exportbtn) => {
            cy.wrap(exportbtn).click()
            // wait for download to complete
            cy.wait(3000)
            // get the CSV file name
            cy.exec("ls cypress/downloads").then((response) => {
                // rename CSV file to export_table.csv
                cy.wrap(response.stdout).should('not.be.empty')
                cy.exec(`mv cypress/downloads/${response.stdout} cypress/downloads/export_table.csv`)
                cy.readFile('cypress/downloads/export_table.csv')
            })
            cy.exec('rm cypress/downloads/export_table.csv')
        })
        netflowPage.clearAllFilters()
    })

    it("(OCP-72610, aramesha, Network_Observability) should validate exporting topology view", function () {
        cy.get('li.topologyTabButton').should('exist').click()
        netflowPage.selectSourceNS(project)
        netflowPage.stopAutoRefresh()
        cy.get('#drawer').should('not.be.empty')
        cy.showAdvancedOptions();
        cy.get('#export-button').should('exist').click()
        cy.readFile('cypress/downloads/topology.png').then(() => {
            cy.exec('rm cypress/downloads/topology.png')
        })
        netflowPage.clearAllFilters()
    })

    afterEach("test", function () {
        netflowPage.resetClearFilters()
    })

    after("all tests", function () {
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
