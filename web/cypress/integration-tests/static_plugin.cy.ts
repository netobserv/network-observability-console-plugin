import { netflowPage, overviewSelectors, pluginSelectors } from "@views/netflow-page"
import { Operator } from "@views/netobserv"

describe('(OCP-84156 Network_Observability) StaticPlugin test', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        cy.adminCLI(`oc adm policy add-cluster-role-to-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector("StaticPlugin")
    })

    it("(OCP-84156, aramesha, Network_Observability) Edit flowcollector form view", function () {
        // Edit flowcollector form view to update sampling to 1
        cy.visit('k8s/cluster/flows.netobserv.io~v1beta2~FlowCollector/status')
        cy.get(pluginSelectors.editFlowcollector).click()
        cy.get('#root_spec_agent_accordion-toggle').click()
        cy.get('#root_spec_agent_ebpf_sampling').clear().type('1')
        cy.get(pluginSelectors.update).click()
        // Wait for flowcollector to get ready
        cy.wait(20000)
        cy.get('[id=Ready-row]').each($td => {
            cy.wrap($td).should('have.attr', 'data-test-status', 'True')
            cy.wrap($td).should('have.attr', "data-test-reason", 'Ready')
        })

        cy.get(pluginSelectors.openNetworkTraffic).click()
        // Verify PacketDrop data is seen
        cy.get('li.overviewTabButton').trigger('click')
        netflowPage.clearAllFilters()
        netflowPage.setAutoRefresh()
        cy.checkPanel(overviewSelectors.defaultPacketDropPanels)
        cy.checkPanelsNum(6);

        cy.checkNetflowTraffic()
    })

    afterEach("test", function () {
        netflowPage.resetClearFilters()
    })

    after("Delete flowcollector", function () {
        Operator.deleteFlowCollector()
        cy.adminCLI(`oc adm policy remove-cluster-role-from-user cluster-admin ${Cypress.env('LOGIN_USERNAME')}`)
    })
})
