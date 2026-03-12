import { catalogSources } from "@views/catalog-source"
import { pluginSelectors } from "@views/netflow-page"
import { operatorHubPage } from "@views/operator-hub-page"

declare global {
    namespace Cypress {
        interface Chainable {
            enableFLPMetrics(tag: string[]): Chainable<Element>
            checkStorageClass(context: Mocha.Context): Chainable<Element>
            deployFlowcollectorFromFixture(fixtureFile: string): Chainable<Element>
        }
    }
}

// Types
type FlowCollectorParameter =
    | 'PacketDrop'
    | 'FlowRTT'
    | 'DNSTracking'
    | 'UDNMapping'
    | 'LokiDisabled'
    | 'Conversations'
    | 'ZonesAndMultiCluster'
    | 'BytesMetrics'
    | 'PacketsMetrics'
    | 'SubnetLabels'
    | 'StaticPlugin'
    | 'NetworkAlertHealth'

// Constants
export const project = "netobserv"

// Environment variables
const catSrc = Cypress.env('NOO_CATALOG_SOURCE')
const catSrcImage: string = Cypress.env('NOO_CS_IMAGE')

// Default catalog images
const DEFAULT_UPSTREAM_IMAGE = 'quay.io/netobserv/network-observability-operator-catalog:v0.0.0-sha-main'
const DEFAULT_DOWNSTREAM_IMAGE = "quay.io/redhat-user-workloads/ocp-network-observab-tenant/catalog-ystream:latest"

// FlowCollector fixture paths (relative to web/ directory where Cypress executes)
const FIXTURE_PATHS = {
    default: './cypress/fixtures/flowcollector/fc.yaml',
    bytesMetrics: './cypress/fixtures/flowcollector/fc_bytesMetrics.yaml',
    packetsMetrics: './cypress/fixtures/flowcollector/fc_packetsMetrics.yaml',
    packetDrop: './cypress/fixtures/flowcollector/fc_packetDrop.yaml',
    dnsTracking: './cypress/fixtures/flowcollector/fc_DNSTracking.yaml',
    flowRTT: './cypress/fixtures/flowcollector/fc_flowRTT.yaml',
    udnMapping: './cypress/fixtures/flowcollector/fc_UDN.yaml',
    lokiDisabled: './cypress/fixtures/flowcollector/fc_lokiDisabled.yaml',
    conversations: './cypress/fixtures/flowcollector/fc_conversations.yaml',
    subnetLabels: './cypress/fixtures/flowcollector/fc_subnetLabel.yaml',
    zonesMultiCluster: './cypress/fixtures/flowcollector/fc_zoneMulticluster.yaml',
    networkAlertHealth: './cypress/fixtures/flowcollector/fc_networkalert.yaml'
} as const

export const Operator = {
    name: () => {
        if (`${Cypress.env('NOO_CATALOG_SOURCE')}` == "upstream") {
            return "NetObserv Operator"
        }
        else {
            return "Network Observability"
        }
    },
    install_catalogsource: () => {
        let catalogDisplayName = "Production Operators"
        let catalogImg: string
        let catalogSource: string

        if (catSrc == "upstream") {
            catalogImg = catSrcImage ? catSrcImage : DEFAULT_UPSTREAM_IMAGE
            catalogSource = "netobserv-test"
            catalogDisplayName = "NetObserv QE"
            catalogSources.createCustomCatalog(catalogImg, catalogSource, catalogDisplayName)
        }
        else {
            catalogImg = catSrcImage ? catSrcImage : DEFAULT_DOWNSTREAM_IMAGE
            catalogSource = "netobserv-konflux-fbc"
            catalogDisplayName = "NetObserv Konflux"
            catalogSources.createCustomCatalog(catalogImg, catalogSource, catalogDisplayName)
            // deploy ImageDigetMirrorSet
            cy.adminCLI('oc apply -f ./cypress/fixtures/image-digest-mirror-set.yaml')
        }
        return catalogSource
    },
    install: () => {
        if (`${Cypress.env('SKIP_NOO_INSTALL')}` == "true") {
            return null
        }
        var catalogSource = Operator.install_catalogsource()

        cy.visit(`/k8s/ns/openshift-netobserv-operator/operators.coreos.com~v1alpha1~ClusterServiceVersion`);
        // if user still does not have admin access
        // try few more times
        cy.contains("openshift-netobserv-operator").should('be.visible')
        cy.get("div.loading-box").should('be.visible').then(() => {
            for (let retries = 0; retries <= 15; retries++) {
                cy.get("div.loading-box").should('be.visible')
                if (Cypress.$('.co-disabled').length == 1) {
                    cy.log(`user does not have access ${retries}`)
                    cy.wait(5000)
                    cy.reload(true)
                }
                else {
                    break;
                }
            }
        })
        // don't install operator if its already installed
        cy.get("div.loading-box").should('be.visible').then(loading => {
            if (Cypress.$('td[role="gridcell"]').length == 0) {
                if (catSrc == "upstream") {
                    // metrics checkbox is not available for upstream operators
                    operatorHubPage.install("netobserv-operator", catalogSource, false)
                } else {
                    operatorHubPage.install("netobserv-operator", catalogSource, true)
                }
            }
        })
    },
    visitFlowcollector: () => {
        cy.visit('k8s/ns/openshift-netobserv-operator/operators.coreos.com~v1alpha1~ClusterServiceVersion')
        const selector = '[data-test-operator-row="' + Operator.name() + '"]'
        cy.get(selector).invoke('attr', 'href').then(href => {
            cy.visit(href)
        })

        cy.contains('Flow Collector').invoke('attr', 'href').then(href => {
            cy.visit(href)
        })
    },
    createFlowcollector: (parameters?: FlowCollectorParameter) => {
        Operator.visitFlowcollector()
        cy.get('div.loading-box__loaded:nth-child(2)').should('exist')
        cy.wait(3000)
        cy.get("#yaml-create").should('exist').then(() => {
            if ((Cypress.$('td[role="gridcell"]').length > 0) && (parameters != null)) {
                Operator.deleteFlowCollector()
                // come back to flowcollector tab after deletion
                Operator.visitFlowcollector()
            }
        })
        // don't create flowcollector if already exists
        cy.get('div.loading-box:nth-child(1)').should('be.visible').then(() => {
            if (Cypress.$('td[role="gridcell"]').length == 0) {
                cy.log("Deploying flowcollector")
                switch (parameters) {
                    case "PacketDrop":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.packetDrop)
                        break;
                    case "FlowRTT":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.flowRTT)
                        break;
                    case "DNSTracking":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.dnsTracking)
                        break;
                    case "UDNMapping":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.udnMapping)
                        break;
                    case "LokiDisabled":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.lokiDisabled)
                        break;
                    case "Conversations":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.conversations)
                        break;
                    case "ZonesAndMultiCluster":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.zonesMultiCluster)
                        break;
                    case "BytesMetrics":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.bytesMetrics)
                        break;
                    case "PacketsMetrics":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.packetsMetrics)
                        break;
                    case "SubnetLabels":
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.subnetLabels)
                        break;
                    case "StaticPlugin":
                        // Flowcollector deployed with PacketDrop enabled
                        Operator.deployFlowcollectorFromUI()
                        break;
                    case "NetworkAlertHealth":
                        // Flowcollector deployed with DNSTracking enabled
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.networkAlertHealth)
                        break;
                    default:
                        cy.deployFlowcollectorFromFixture(FIXTURE_PATHS.default)
                        break;
                }
                // Bug: OCPBUGS-58468
                // cy.byTestID('refresh-web-console', { timeout: 60000 }).should('exist')
                // cy.reload(true)
                cy.intercept('**/copy-login-commands*').as('reload')
                // wait for all window refresh
                cy.wait('@reload', { timeout: 60000 })
                cy.log("Console refreshed successfully")
                Operator.visitFlowcollector()
                cy.byTestID('status-text').should('exist').should('contain.text', 'Ready')
                // Check for loki pod running in netobserv namespace only if Loki is not disabled
                if (parameters !== "LokiDisabled") {
                    cy.adminCLI(`oc get pods -n ${project} -l app=loki -o jsonpath="{.items[*].status.phase}"`).then(result => {
                        const phases = result.stdout.trim().split(' ')
                        expect(phases).to.include('Running')
                    })
                }
            }
        })
    },
    deployFlowcollectorFromUI: () => {
        cy.byTestID('item-create').should('exist').click()
        // Overview tab
        cy.get(pluginSelectors.next).should('exist').click()
        // Processing tab
        cy.get(pluginSelectors.privilegedToggle).should('exist').click()
        // Enable PacketDrop
        cy.get(pluginSelectors.packetDropEnable).should('exist').check()
        cy.get(pluginSelectors.next).should('exist').click()
        // Loki tab
        cy.get(pluginSelectors.lokiMode).should('exist').click().then(mode => {
            cy.get(pluginSelectors.monolithicMode).should('exist').click()
        })
        // Install demoLoki
        cy.get(pluginSelectors.installDemoLoki).should('exist').click()
        cy.get(pluginSelectors.next).should('exist').click()
        // Consumption tab
        cy.get(pluginSelectors.next).should('exist').click()
    },
    deleteFlowCollector: () => {
        cy.adminCLI(`oc delete flowcollector cluster --ignore-not-found`)
        // Bug: OCPBUGS-58468
        // cy.byTestID('refresh-web-console', { timeout: 60000 }).should('exist')
        // cy.reload(true)
    },
    uninstall: () => {
        cy.visit('k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion')

        cy.contains(Operator.name()).should('exist').invoke('attr', 'href').then(href => {
            cy.visit(href)
        })
        cy.get('.co-actions-menu > .pf-c-dropdown__toggle').should('exist').click()
        cy.byTestActionID('Uninstall Operator').should('exist').click()
        cy.byTestID('confirm-action').should('exist').click()
    },
    deleteCatalogSource: (catalogSource: string) => {
        cy.visit('k8s/cluster/config.openshift.io~v1~OperatorHub/cluster/sources')
        cy.byTestID(catalogSource).should('exist').invoke('attr', 'href').then(href => {
            cy.visit(href)
        })
        cy.get('.co-actions-menu > .pf-c-dropdown__toggle').should('exist').click()
        cy.byTestActionID('Delete CatalogSource').should('exist').click()
        cy.byTestID('confirm-action').should('exist').click()
    }
}

Cypress.Commands.add('checkStorageClass', (context: Mocha.Context) => {
    let storageClassCheck = false
    cy.adminCLI('oc get sc', { failOnNonZeroExit: false }).then(result => {
        if (result.stderr.includes('No resources found')) {
            cy.log('StorageClass not deployed, skipping')
            storageClassCheck = true
        }
        cy.wrap(storageClassCheck).then(scCheck => {
            if (scCheck) {
                context.skip()
            }
        })
    })
});

Cypress.Commands.add('enableFLPMetrics', (tags: string[]) => {
    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        cy.get('#root_spec_processor_metrics_includeList_add-btn').should('exist').click()
        cy.get(`#root_spec_processor_metrics_includeList_${i}`).should('exist').click().then(metrics => {
            cy.get(`#${tag}-link`).should('exist').click()
        })
    }
});

Cypress.Commands.add('deployFlowcollectorFromFixture', (fixtureFile: string) => {
    cy.adminCLI(`oc apply -f ${fixtureFile}`)
})
