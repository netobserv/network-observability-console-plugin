export namespace networkHealthSelectors {
    export const global = '[id^="pf-tab-global"]'
    export const node = '[id^="pf-tab-per-node"]'
    export const namespace = '[id^="pf-tab-per-namespace"]'
    export const workload = '[id^="pf-tab-per-owner"]'
    export const nodeCard = '[id^=health-card-ip]'
    export const sidePanel = '.health-gallery-drawer-content'
}


export const networkHealth = {
    clickOnAlert: (name: string) => {
        // pick the first from the list
        cy.get(`label[for^="health-card-${name}"]`).eq(0).should('be.visible').click()
    },
    verifyAlert: (name: string, mode: string = "alert", alertText?: string) => {
        // click force since node cards are covered
        cy.get(`label[for^="health-card-${name}"]`).eq(0).should('be.visible').click({ force: true }).then(() => {
            cy.get(networkHealthSelectors.sidePanel).should('be.visible')
            cy.contains(mode).should('exist')
            if (alertText) {
                cy.contains(alertText).should('exist')

            }
            cy.get(`label[for^="health-card-${name}"]`).eq(0).click()
            cy.get(networkHealthSelectors.sidePanel).should('not.exist')
        })
    },
    navigateToAlertPage: (name: string) => {
        networkHealth.clickOnAlert(name)
        cy.get(networkHealthSelectors.sidePanel).should('be.visible').then(() => {
            // click the kebab button
            cy.get('div.rule-details-row:nth-child(1) button').click().then(() => {
                cy.get('button[role="menuitem"]').eq(1).click().then(() => {
                    // "No Alert found" should not show up.
                    cy.byTestID('empty-box').should('not.exist')
                })
            })
        })
    },
    navigateToNetflowTrafficPage: (name: string) => {
        networkHealth.clickOnAlert(name)
        cy.get(networkHealthSelectors.sidePanel).should('be.visible').then(() => {
            // click the kebab button

            cy.get('div.rule-details-row:nth-child(1) button').click().then(() => {
                cy.get('button[role="menuitem"]').eq(1).click().then(() => {

                })
            })
        })
    }
}
