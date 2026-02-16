

describe('env test (Network_Observability)', { tags: ['Network_Observability'] }, function () {

    before('any test', function () {
        // if (`${Cypress.env('E2E_RUN_TAGS')}`.includes("disconnected")) {
        //     this.skip()
        // }
        // Cypress.currentTest.
        // cy.skipIfDisconnectedCluster(this)
        var test = true
        cy.wrap(test).then(test => {
            if (test) {
                this.skip()
            }
        })
    })
    it("env test", function () {

    })
    it("env test2", function () {
    })

})
