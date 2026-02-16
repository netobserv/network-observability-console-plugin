import { colSelectors, filterSelectors, netflowPage } from "@views/netflow-page"
import { Operator } from "@views/netobserv"

describe('(OCP-67615, OCP-72874 Network_Observability) Return external traffic and custom subnet labels test', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector("SubnetLabels")

        // deploy test pod
        cy.adminCLI('oc create -f cypress/fixtures/test-pod.yaml')
    })

    it("(OCP-67615, aramesha, Network_Observability) External traffic and custom subnet label", function () {
        netflowPage.visit()
        cy.get('#tabs-container li:nth-child(2)').click()
        cy.byTestID("table-composable").should('exist')

        // enable SrcSubnetLabel and DstSubnetLabel columns
        cy.openColumnsModal().then(col => {
            cy.get(colSelectors.columnsModal).should('be.visible')
            cy.get('#SrcSubnetLabel').check()
            cy.get('#DstSubnetLabel').check()
            cy.byTestID(colSelectors.save).click()
        })

        // filter on SrcSubnetLabel Pods and DstIP 52.200.142.250
        cy.get(filterSelectors.filterInput).type("src_subnet_label=Pods" + '{enter}')
        cy.get(filterSelectors.filterInput).type("dst_address=52.200.142.250" + '{enter}')
        netflowPage.waitForLokiQuery()

        // validate rows count=1
        cy.byTestID('table-composable').invoke('attr', 'data-test-rows-count').then(count => {
            expect(count).to.contain(1)
        })

        // validate SrcSubnetLabel=Pods and DstSustomLabel=testcustomlabel for custom subnet labels
        cy.get('[data-test-td-column-id=SrcSubnetLabel]').each((td) => {
            expect(td).attr("data-test-td-value").to.contain('Pods')
        })
        cy.get('[data-test-td-column-id=DstSubnetLabel]').each((td) => {
            expect(td).to.contain('testcustomlabel')
        })

        // validate bidirectional flows
        cy.get('#match-1-dropdown').click().get(filterSelectors.biDirectional).click()

        // validate rows count=2
        cy.byTestID('table-composable').invoke('attr', 'data-test-rows-count').then(count => {
            expect(count).to.contain(2)
        })

        netflowPage.clearAllFilters()
    })

    afterEach("test", function () {
        netflowPage.resetClearFilters()
    })

    after("all tests", function () {
        cy.adminCLI('oc delete -f cypress/fixtures/test-pod.yaml')
        Operator.deleteFlowCollector()
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
