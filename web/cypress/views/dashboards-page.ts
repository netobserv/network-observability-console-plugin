export const dashboard = {
    visit: () => {
        cy.visit('/monitoring/dashboards')
        cy.byTestID('dashboard-dropdown', { timeout: 120000 }).should('exist').click()
    },
    visitDashboard: (dashboardName: string) => {
        cy.visit(`/monitoring/dashboards/${dashboardName}`)

        // Revert once https://issues.redhat.com/browse/OCPBUGS-57307 is fixed
        // cy.get('#refresh-interval-dropdown-dropdown').should('exist').then(btn => {
        //     cy.wrap(btn).click().then(drop => {
        //         cy.contains('15 seconds').should('exist').click()
        //     })
        // })
        cy.get('label[for="refresh-interval-dropdown"]').parent().parent().parent().within(() => {
            cy.get('button').click()
        })
        cy.contains('15 seconds').should('exist').click()

        // Revert once https://issues.redhat.com/browse/OCPBUGS-57307 is fixed
        // cy.get('#monitoring-time-range-dropdown-dropdown').should('exist').then(btn => {
        //     cy.wrap(btn).click().then(drop => {
        //         cy.contains('Last 5 minutes').should('exist').click()
        //     })
        // })
        cy.get('label[for="monitoring-time-range-dropdown"]').parent().parent().parent().within(() => {
            cy.get('button').click()
        })
        cy.contains('Last 5 minutes').should('exist').click()

        // to load all the graphs on the dashboard
        cy.wait(1000)
        cy.get('#content-scrollable').scrollTo('bottom')
        cy.wait(1000)
    }
}

export namespace dashboardSelectors {
    export const flowStatsToggle = '[data-test-id=panel-flowlogs-pipeline-statistics] > div > div > div > button'
    export const ebpfStatsToggle = '[data-test-id=panel-e-bpf-agent-statistics]> div > div > div > button'
    export const operatorStatsToggle = '[data-test-id=panel-operator-statistics] > div > div > div > button'
    export const resourceStatsToggle = '[data-test-id=panel-resource-usage] > div > div > div > button'
    export const top10PerRouteToggle = '[data-test-id=panel-top-10-per-route] > div > div > div > button'
    export const top10PerNamespaceToggle = '[data-test-id=panel-top-10-per-namespace] > div > div > div > button'
    export const top10PerShardToggle = '[data-test-id=panel-top-10-per-shard] > div > div > div > button'
}

export const graphSelector = {
    graphBody: '.pf-v6-c-card__body > div > div'
}

export const appsInfra = [
    "applications-chart",
    "infrastructure-chart"
]

Cypress.Commands.add('checkDashboards', (names) => {
    for (let i = 0; i < names.length; i++) {
        cy.byTestID(names[i]).should('exist', { timeout: 120000 })
            .find(graphSelector.graphBody).should('not.have.class', 'pf-v6-c-empty-state', { timeout: 120000 })
    }
})

declare global {
    namespace Cypress {
        interface Chainable {
            checkDashboards(names: string[]): Chainable<Element>
        }
    }
}
