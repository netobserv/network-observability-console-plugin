declare global {
    namespace Cypress {
        interface Chainable {
            showAdvancedOptions(): Chainable<Element>
            checkPanelsNum(panels?: number): Chainable<Element>
            checkPanel(panelName: string[]): Chainable<Element>
            openPanelsModal(): Chainable<Element>
            openColumnsModal(): Chainable<Element>
            selectPopupItems(id: string, names: string[]): Chainable<Element>
            checkPopupItems(id: string, names: string[]): Chainable<Element>
            checkQuerySummary(metric: JQuery<HTMLElement>): Chainable<Element>
            checkPerformance(page: string, loadTime: number, memoryUsage: number): Chainable<Element>
            changeQueryOption(name: string): Chainable<Element>
            visitNetflowTrafficTab(page: string): Chainable<Element>
            checkNetflowTraffic(loki?: string): Chainable<Element>
        }
    }
}

type Group = 'Node' | 'Namespace' | 'Owner' | 'Resource'

export const netflowPage = {
    visit: (clearfilters = true) => {
        cy.clearLocalStorage()
        cy.visit('/netflow-traffic')

        cy.wrap(clearfilters).then(shouldClearFilters => {
            if (shouldClearFilters) {
                netflowPage.clearAllFilters()
            }
        })
        // set the page to auto refresh
        netflowPage.setAutoRefresh()

        cy.byTestID('no-results-found').should('not.exist')
        cy.get('#overview-container').should('exist')
    },
    toggleFullScreen: () => {
        cy.byTestID(genSelectors.moreOpts).should('exist').click().then(() => {
            cy.get(genSelectors.expand).click()
        })
    },
    setAutoRefresh: () => {
        cy.byTestID(genSelectors.refreshDrop).should('exist').then($btn => {
            // only set refresh if it's OFF
            if ($btn.text() == "Refresh off") {
                cy.wrap($btn).click({ force: true })
                cy.get('[data-test="15s"]').should('exist').click()
            }
        })
    },
    stopAutoRefresh: () => {
        cy.byTestID(genSelectors.refreshDrop).should('exist').then($btn => {
            // only stop refresh if it's not already OFF
            if ($btn.text() != "Refresh off") {
                cy.wrap($btn).click({ force: true })
                cy.get('[data-test="OFF_KEY"]').should('exist').click({ force: true })
            }
        })
    },
    resetClearFilters: () => {
        cy.byTestID("set-default-filters-button").should('exist').click()
    },
    clearAllFilters: () => {
        cy.byTestID("clear-all-filters-button").should('exist').click()
    },
    waitForLokiQuery: () => {
        cy.get("#refresh-button > span > svg").invoke('attr', 'style').should('contain', '0s linear 0s')
    },
    selectSourceNS: (project: string) => {
        // verify Source namespace filter
        cy.get(filterSelectors.filterInput).type("src_namespace=" + project + '{enter}')
        cy.get('#src_namespace-0-toggle > span.pf-v5-c-menu-toggle__text').should('contain.text', `${project}`)
    }
}

export const topologyPage = {
    selectScopeGroup: (scope?: string, group?: string) => {
        cy.contains('Display options').should('exist').click()
        if (scope) {
            cy.byTestID("scope-dropdown").click().byTestID(scope).click()
        }
        if (group) {
            cy.wait(5000)
            cy.byTestID("group-dropdown").click().byTestID(group).click()
        }
        cy.contains('Display options').should('exist').click()
    },
    isViewRendered: () => {
        cy.get('[data-surface="true"]').should('exist')
    },
    selectGroupWithSlider: (group: Group) => {
        let selector
        switch (group) {
            case 'Node':
                selector = '#scope-step-0'
                break
            case 'Namespace':
                selector = '#scope-step-1'
                break
            case 'Owner':
                selector = '#scope-step-2'
                break
            case 'Resource':
                selector = '#scope-step-3'
                break
        }
        cy.get('#lastRefresh').invoke('text').then((lastRefresh) => {
            cy.get(`${selector} >  div:nth-child(2) > button`).click().then(slider => {
                netflowPage.waitForLokiQuery()
                cy.wait(3000)
                cy.get('#lastRefresh').invoke('text').should('not.eq', lastRefresh)
            })
        })
    }
}

/**
 * Helper function to setup topology view with optional namespace filter
 * Navigates to topology tab, clears filters, optionally applies namespace filter, and sets display options
 * @param namespace - Optional namespace to filter topology view by
 */
export function setupTopologyViewWithNamespaceFilter(namespace?: string) {
    cy.clearLocalStorage()
    netflowPage.visit()
    cy.get('#tabs-container li:nth-child(3)').click()

    if (Cypress.$('[data-surface=true][transform="translate(0, 0) scale(1)]').length > 0) {
        cy.get('[data-test="filters"] > [data-test="clear-all-filters-button"]').should('exist').click()
    }
    cy.get('#drawer').should('not.be.empty')

    // Add filter for namespace if provided
    if (namespace) {
        cy.get(filterSelectors.filterInput).type("src_namespace=" + namespace + '{enter}')
        cy.get('#src_namespace-0-toggle > span.pf-v5-c-menu-toggle__text').should('contain.text', `${namespace}`)
    }

    cy.byTestID("show-view-options-button").should('exist').click().then(() => {
        cy.contains('Display options').should('exist').click()
        cy.byTestID('layout-dropdown').click()
        cy.byTestID('Grid').click()
    })
    cy.byTestID(topologySelectors.metricsFunctionDrop).should('exist').click().get('#sum').click()
    cy.contains('Display options').should('exist').click()
}

export namespace pluginSelectors {
    export const next = '#wizard-container > div > div > footer > button.pf-v5-c-button.pf-m-primary'
    export const back = '#wizard-container > div > div > footer > button.pf-v5-c-button.pf-m-secondary'
    export const save = '[data-test=save-changes]'
    export const del = '#editor-toggle-footer > div > div > div > button.pf-v5-c-button.pf-m-danger'
    export const confirmDel = '#delete-modal > div > div.modal-footer > div > button.pf-v5-c-button.pf-m-danger'
    export const openNetworkTraffic = '#open-network-traffic'
    export const editFlowcollector = '#edit-flow-collector'
    export const update = '#editor-toggle-footer > div > div > div > button.pf-v5-c-button.pf-m-primary'
    export const privilegedToggle = '#root_spec_agent_ebpf_privileged_field > div > div.pf-m-flex-4 > label > span.pf-v5-c-switch__toggle'
    export const packetDropEnable = '[data-test-id=root_spec_agent_ebpf_features-PacketDrop]'
    export const lokiMode = '#root_spec_loki_mode-toggle'
    export const monolithicMode = '#root_spec_loki_mode-Monolithic'
    export const installDemoLoki = '#root_spec_loki_monolithic_installDemoLoki_field > .pf-v5-l-flex > .pf-m-flex-4 > .pf-v5-c-switch > .pf-v5-c-switch__toggle'
}

export namespace genSelectors {
    export const timeDrop = "time-range-dropdown-dropdown"
    export const refreshDrop = "refresh-dropdown-dropdown"
    export const refreshBtn = 'refresh-button'
    export const moreOpts = 'more-options-button'
    export const fullScreen = '[data-test=fullscreen-button]'
    export const expand = '[index="2"] > ul > li > .pf-c-dropdown__menu-item'
}

export namespace colSelectors {
    export const columnsModal = '.modal-content'
    export const save = 'columns-save-button'
    export const resetDefault = 'columns-reset-button'
    export const mac = '[data-test=th-Mac] > .pf-v5-c-table__button'
    export const k8sOwner = '[data-test=th-K8S_OwnerObject] > .pf-v5-c-table__button'
    export const ipPort = '[data-test=th-AddrPort] > .pf-v5-c-table__button'
    export const protocol = '[data-test=th-Proto] > .pf-v5-c-table__button'
    export const icmpType = '[data-test=th-IcmpType] > .pf-v5-c-table__button'
    export const icmpCode = '[data-test=th-IcmpCode] > .pf-v5-c-table__button'
    export const srcNodeIP = '[data-test=th-SrcK8S_HostIP] > .pf-v5-c-table__button'
    export const srcNS = '[data-test=th-SrcK8S_Namespace] > .pf-v5-c-table__button'
    export const dstNodeIP = '[data-test=th-DstK8S_HostIP] > .pf-v5-c-table__button'
    export const direction = '[data-test=th-FlowDirection] > .pf-v5-c-table__button'
    export const bytes = '[data-test=th-Bytes] > .pf-v5-c-table__button'
    export const packets = '[data-test=th-Packets] > .pf-v5-c-table__button'
    export const recordType = '[data-test=th-RecordType] > .pf-v5-c-table__button'
    export const conversationID = '[data-test=th-_HashId] > .pf-v5-c-table__button'
    export const flowRTT = '[data-test=th-TimeFlowRttMs] > .pf-v5-c-table__button'
    export const dscp = '[data-test=th-Dscp] > .pf-v5-c-table__button'
    export const dnsLatency = '[data-test=th-DNSLatency] > .pf-v5-c-table__column-help > .pf-v5-c-table__button'
    export const dnsResponseCode = '[data-test=th-DNSResponseCode] > .pf-v5-c-table__column-help > .pf-v5-c-table__button'
    export const dnsId = '[data-test=th-DNSId] > .pf-v5-c-table__button'
    export const dnsError = '[data-test=th-DNSErrNo] > .pf-v5-c-table__button'
    export const dnsName = '[data-test=th-DNSName]'
    export const srcZone = '[data-test=th-SrcZone] > .pf-v5-c-table__button'
    export const dstZone = '[data-test=th-DstZone] > .pf-v5-c-table__button'
    export const clusterName = '[data-test=th-ClusterName] > .pf-v5-c-table__button'
    export const srcNetworkName = '[data-test=th-SrcNetworkName] > .pf-v5-c-table__button'
    export const dstNetworkName = '[data-test=th-DstNetworkName] > .pf-v5-c-table__button'
}

export namespace filterSelectors {
    export const filterNames = "#filters p"
    export const filterInput = '#filter-search-input input'
    export const filterDropdown = '#filter-search-input [type="button"]'
    export const columnFilter = '#column-filter-toggle'
    export const destinationRadio = 'radio-destination'
    export const sourceRadio = '#radio-source'
    export const compareDropdown = '#filter-compare-toggle-button'
    export const biDirectional = '[data-test=bidirectional]'
}

export namespace querySumSelectors {
    export const queryStatsPanel = "#query-summary"
    export const flowsCount = "#flowsCount"
    export const bytesCount = "#bytesCount"
    export const packetsCount = "#packetsCount"
    export const bpsCount = "#bytesPerSecondsCount"
    export const avgRTT = "#rttAvg"
    export const dnsAvg = "#dnsAvg"
    export const droppedBytesCount = "#pktDropBytesCount"
    export const droppedBpsCount = "#pktDropBytesPerSecondsCount"
    export const droppedPacketsCount = "#pktDropPacketsCount"
    export const expandedQuerySummaryPanel = '.pf-c-drawer__panel-main'
}

export namespace topologySelectors {
    export const metricsFunctionDrop = 'metricFunction-dropdown'
    export const metricsFunction = '#metricFunction'
    export const metricTypeDrop = 'metricType-dropdown'
    export const metricType = '#metricType'
    export const optsClose = '.pf-v5-c-drawer__close > .pf-v5-c-button'
    export const nGroups = '[data-layer-id="groups"] > g'
    export const group = 'g[data-type="group"]'
    export const node = 'g[data-kind="node"]:empty'
    export const edge = 'g[data-kind="edge"]'
    export const groupLayer = '[data-layer-id="groups"]'
    export const defaultLayer = '[data-layer-id="default"]'
    export const groupToggle = '[for="group-collapsed-switch"] > .pf-v5-c-switch__toggle'
    export const edgeToggle = "#edges-switch"
    export const labelToggle = '#edges-tag-switch'
    export const badgeToggle = '#badge-switch'
    export const emptyToggle = '#empty-switch'
}

export namespace overviewSelectors {
    export const panelsModal = '.modal-content'
    export const resetDefault = 'panels-reset-button'
    export const save = 'panels-save-button'
    export const cancel = 'panels-cancel-button'
    export const typeDrop = 'type-dropdown'
    export const scopeDrop = 'scope-dropdown'
    export const truncateDrop = 'truncate-dropdown'
    export const managePanelsList = ['Top X average bytes rates (donut)', 'Top X bytes rates stacked with total (bars and lines)', 'Top X average packets rates (donut)', 'Top X packets rates stacked with total (bars and lines)']
    export const managePacketDropPanelsList = ['Top X packet dropped state stacked with total (donut or bars and lines)', 'Top X packet dropped cause stacked with total (donut or bars and lines)', 'Top X average dropped bytes rates (donut)', 'Top X dropped bytes rates stacked with total (bars and lines)', 'Top X average dropped packets rates (donut)', 'Top X dropped packets rates stacked with total (bars and lines)']
    export const manageDNSTrackingPanelsList = ['Top X DNS response code with total (donut or bars and lines)', 'Top X average DNS latencies with overall (donut or lines)', 'Bottom X minimum DNS latencies with overall (donut or lines)', 'Top X maximum DNS latencies with overall (donut or lines)', 'Top X 90th percentile DNS latencies with overall (donut or lines)']
    export const manageFlowRTTPanelsList = ['Top X average TCP smoothed Round Trip Time with overall (donut or lines)', 'Bottom X minimum TCP smoothed Round Trip Time with overall (donut or lines)', 'Top X maximum TCP smoothed Round Trip Time with overall (donut or lines)', 'Top X 90th percentile TCP smoothed Round Trip Time with overall (donut or lines)', 'Top X 99th percentile TCP smoothed Round Trip Time with overall (donut or lines)']
    export const defaultPanels = ['Top 5 average bytes rates', 'Top 5 bytes rates stacked with total']
    export const defaultPacketDropPanels = ['Top 5 packet dropped state stacked with total', 'Top 5 packet dropped cause stacked with total', 'Top 5 average dropped packets rates', 'Top 5 dropped packets rates stacked with total']
    export const defaultDNSTrackingPanels = ['Top 5 DNS response code', 'Top 5 average DNS latencies with overall', 'Top 5 90th percentile DNS latencies']
    export const defaultFlowRTTPanels = ['Top 5 average TCP smoothed Round Trip Time with overall', 'Bottom 5 minimum TCP smoothed Round Trip Time', 'Top 5 90th percentile TCP smoothed Round Trip Time']
    export const allPanels = defaultPanels.concat(['Top 5 average packets rates', 'Top 5 packets rates'])
    export const allPacketDropPanels = defaultPacketDropPanels.concat(['Top 5 average dropped bytes rates', 'Top 5 dropped bytes rates stacked with total'])
    export const allDNSTrackingPanels = defaultDNSTrackingPanels.concat(['Bottom 5 minimum DNS latencies', 'Top 5 maximum DNS latencies', 'Top 5 DNS name'])
    export const allFlowRTTPanels = defaultFlowRTTPanels.concat(['Top 5 maximum TCP smoothed Round Trip Time', 'Top 5 99th percentile TCP smoothed Round Trip Time'])
}

export const loadTimes = {
    "overview": 8500,
    "table": 5000,
    "topology": 5000
}

export const memoryUsage = {
    "overview": 300,
    "table": 450,
    "topology": 360
}

export namespace histogramSelectors {
    export const timeRangeContainer = "#chart-histogram > div.pf-v5-l-flex.pf-m-row.histogram-range-container"
    export const zoomin = timeRangeContainer + " > div:nth-child(5) > div > div:nth-child(2) > div > button"
    export const zoomout = timeRangeContainer + "> div:nth-child(5) > div > div:nth-child(1) > div > button"
    const forwardShift = timeRangeContainer + "> div:nth-child(4)"
    export const singleRightShift = forwardShift + "> div:nth-child(1) > button"
    export const doubleRightShift = forwardShift + "> div:nth-child(2) > button"
    const backwardShift = timeRangeContainer + "> div:nth-child(2)"
    export const singleLeftShift = backwardShift + "> div:nth-child(2) > button"
    export const doubleLeftShift = backwardShift + "> div:nth-child(1) > button"
}

Cypress.Commands.add('showAdvancedOptions', () => {
    cy.get('#show-view-options-button')
        .then(function ($button) {
            if ($button.text() === 'Hide advanced options') {
                return;
            } else {
                cy.get('#show-view-options-button').click();
            }
        })
});

Cypress.Commands.add('checkPanelsNum', (panels = 2) => {
    cy.get('#overview-flex').find('.overview-card').its('length').should('eq', panels);
});

Cypress.Commands.add('checkPanel', (panelName) => {
    for (let i = 0; i < panelName.length; i++) {
        cy.get('#overview-flex', { timeout: 60000 }).contains(panelName[i]);
        cy.get('[data-test-metrics]', { timeout: 120000 }).its('length').should('gt', 0);
    }
});

Cypress.Commands.add('openPanelsModal', () => {
    cy.showAdvancedOptions();
    cy.get('#manage-overview-panels-button').click();
    cy.get('#overview-panels-modal').should('exist');
});

Cypress.Commands.add('openColumnsModal', () => {
    cy.showAdvancedOptions();
    cy.get('#manage-columns-button').click();
    cy.get('#columns-modal').should('exist');
});

Cypress.Commands.add('checkPopupItems', (id, names) => {
    for (let i = 0; i < names.length; i++) {
        cy.get(id).contains(names[i])
            .closest('.pf-v5-c-data-list__item-row').find('.pf-v5-c-data-list__check');
    }
});

Cypress.Commands.add('selectPopupItems', (id, names) => {
    for (let i = 0; i < names.length; i++) {
        cy.get(id).contains(names[i])
            .closest('.pf-v5-c-data-list__item-row').find('.pf-v5-c-data-list__check').click();
    }
});

Cypress.Commands.add('checkQuerySummary', (metric) => {
    let warningExists = false
    let num = 0
    let metricStr: string

    cy.get(querySumSelectors.queryStatsPanel).should('exist').then(() => {
        if (Cypress.$(querySumSelectors.queryStatsPanel + ' svg.query-summary-warning').length > 0) {
            warningExists = true
        }
    })

    if (warningExists) {
        metricStr = metric.text().split('+ ')[0]
        if (metricStr.includes('k')) {
            num = Number(metricStr.split('k')[0])
        } else {
            num = Number(metricStr)
        }
    } else {
        num = Number(metric.text().split(' ')[0])
    }

    expect(num).to.be.greaterThan(0)
});

Cypress.Commands.add('changeQueryOption', (name: string) => {
    cy.get('#filter-toolbar-search-filters').contains('Query options').click();
    cy.get('#query-options-dropdown').contains(name).click();
    cy.get('#filter-toolbar-search-filters').contains('Query options').click();
});

Cypress.Commands.add('visitNetflowTrafficTab', (page) => {
    cy.visit(page)
    cy.get('tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)
    cy.get('tbody tr').first().find('td').first().find('a').click()

    cy.byLegacyTestID('horizontal-link-Network Traffic').should('exist').click()

    // validate netflow-traffic page shows values
    cy.checkNetflowTraffic()
});

Cypress.Commands.add('checkNetflowTraffic', (loki = "Enabled") => {
    // overview panels
    cy.get('li.overviewTabButton').should('exist').click({ force: true })
    cy.checkPanel(overviewSelectors.defaultPanels)

    // table view
    if (loki == "Disabled") {
        // verify netflow traffic page is disabled
        cy.get('li.tableTabButton').should('exist').should('have.class', 'pf-m-disabled')
    }
    else {
        cy.get('li.tableTabButton').should('exist').click()
        cy.wait(1000)
        cy.byTestID("table-composable", { timeout: 60000 }).should('exist')
    }

    // topology view
    cy.get('li.topologyTabButton').should('exist').click()
    cy.wait(2000)
    cy.get('#drawer', { timeout: 60000 }).should('not.be.empty')
});
