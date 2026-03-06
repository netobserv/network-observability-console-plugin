import { netflowPage } from "@views/netflow-page"
import { Operator } from "@views/netobserv"

describe.skip('(OCP-67617 Network_Observability) User in group with cluster-admin role', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        // create new group, add user to that group and give that group cluster-admin role
        cy.adminCLI(`oc adm groups new netobservadmins`)
        cy.adminCLI(`oc adm groups add-users netobservadmins ${Cypress.env('LOGIN_USERNAME')}`)
        cy.adminCLI(`oc adm policy add-cluster-role-to-group cluster-admin netobservadmins`)
        cy.uiLogin(Cypress.env('LOGIN_IDP'), Cypress.env('LOGIN_USERNAME'), Cypress.env('LOGIN_PASSWORD'))

        Operator.install()
        cy.checkStorageClass(this)
        Operator.createFlowcollector()
    })

    it("(OCP-67617, aramesha, Network_Observability) should verify user in group with cluster-admin role is able to access flows", function () {
        // validate netflow traffic page
        netflowPage.visit()
        cy.checkNetflowTraffic()
    })

    it("(OCP-67617, aramesha, Network_Observability) should verify user NOT in group with cluster-admin role is NOT able to access flows", function () {
        // remove user from cluster-admin group
        cy.adminCLI(`oc adm policy remove-cluster-role-from-group cluster-admin netobservadmins`)
        cy.visit('/netflow-traffic')
        // validate user is not able to access netflow traffic page
        // overview shows no panels
        cy.get('li.overviewTabButton').should('exist').click()
        cy.get("#overview-flex").should('not.exist')

        // table view shows no grid
        cy.get('li.tableTabButton').should('exist').click()
        cy.byTestID("table-composable").should('not.exist')

        // topology view shows no view
        cy.get('li.topologyTabButton').should('exist').click()
        cy.byTestID("error-state").should('exist')
    })

    after("all tests", function () {
        cy.adminCLI(`oc adm groups remove-users netobservadmins ${Cypress.env('LOGIN_USERNAME')}`)
        cy.adminCLI(`oc delete groups netobservadmins`)
    })
})
