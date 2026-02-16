export const catalogSources = {
    navToOperatorHubSources: () => {
        cy.visit('k8s/cluster/config.openshift.io~v1~OperatorHub/cluster/sources')
        cy.get('#yaml-create').should('exist')
    },
    getOCPVersion: () => {
        let cmd = `oc version -o json --kubeconfig=${Cypress.env('KUBECONFIG_PATH')} | grep openshiftVersion | awk -F'"' '{print $4}' | awk -F'.' '{print $1"."$2}' `
        cy.exec(cmd).then(result => {
            expect(result.stderr).to.be.empty
            cy.wrap(result.stdout).as('VERSION')
        })
    },
    enableQECatalogSource: (catalogName = "qe-app-registry", catalogDisplayName = "QE Catalog") => {
        // add QE catalog only if it does not exist.
        let cmd = `oc get -n openshift-marketplace catalogsource ${catalogName} --kubeconfig=${Cypress.env('KUBECONFIG_PATH')} 2>&1`
        cy.exec(cmd, { failOnNonZeroExit: false }).then(result => {
            cy.wrap(result.stdout).then((out) => {
                if (out.includes("NotFound")) {
                    cy.adminCLI(`oc create -f ./fixtures/icsp.yaml`)
                    catalogSources.getOCPVersion()
                    cy.get('@VERSION').then((VERSION) => {
                        const INDEX_IMAGE = `quay.io/openshift-qe-optional-operators/aosqe-index:v${VERSION}`
                        cy.log(`adding catalog source ${INDEX_IMAGE}`)
                        catalogSources.navToOperatorHubSources();
                        cy.get('#yaml-create').should('exist').click()
                        cy.get("#catalog-source-name").type(catalogName)
                        cy.get('#catalog-source-display-name').type(catalogDisplayName)
                        cy.get('#catalog-source-image').type(INDEX_IMAGE)
                        cy.get('#save-changes').click()
                    })
                }
            })
        })
        cy.checkCommandResult(`oc get catalogsource ${catalogName} -n openshift-marketplace -o jsonpath='{.status.connectionState.lastObservedState}'`, 'READY', { retries: 6, interval: 10000 });
    },
    createCustomCatalog: (image: any, catalogName: string, displayName: string) => {
        catalogSources.navToOperatorHubSources()
        // create custom catalog only if its not already present
        let cmd = `oc get -n openshift-marketplace catalogsource ${catalogName} --kubeconfig=${Cypress.env('KUBECONFIG_PATH')} 2>&1`
        cy.exec(cmd, { failOnNonZeroExit: false }).then(result => {
            cy.wrap(result.stdout).then((out) => {
                if (out.includes("NotFound")) {
                    cy.byTestID('item-create').should('exist').click()
                    cy.byTestID('catalog-source-name').type(catalogName)
                    cy.get('#catalog-source-display-name').type(displayName)
                    cy.get('#catalog-source-publisher').type('ocp-qe')
                    cy.byTestID('catalog-source-image').type(image)
                    cy.byTestID('save-changes').click()
                }
            })
        })
        cy.byTestID(catalogName).should('exist')
        cy.checkCommandResult(`oc get catalogsource ${catalogName} -n openshift-marketplace -o jsonpath='{.status.connectionState.lastObservedState}'`, 'READY', { retries: 6, interval: 10000 });
    }
}
