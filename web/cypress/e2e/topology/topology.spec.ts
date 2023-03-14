/// <reference types="cypress" />

import * as c from '../../support/const'

describe('netflow-topology', () => {
  beforeEach(() => {
    cy.openNetflowTrafficPage();
    //move to topology view
    cy.get('.topologyTabButton').click();
    //clear default app filters
    cy.get('#clear-all-filters-button').click();
  });

  it('displays topology and namespaces', () => {
    cy.get('.pf-topology-visualization-surface').should('exist');
    //expect some namespaces & edges in the default layer
    cy.get('[data-layer-id="default"]').children().its('length').should('be.gte', 100);

    cy.addCommonFilter('namespace', c.namespace, true);
    cy.addCommonFilter('name', c.pod, true);
    cy.changeMetricType('Packets');
    cy.changeMetricType('Bytes');
    cy.changeQueryOption('Both', true);
    cy.changeQueryOption('Match all', true);
    cy.changeTimeRange('Last 1 day', true);
  });

  it('find network observability namespace', () => {
    //show advanced options
    cy.showAdvancedOptions();
    //type our namespace name and press enter
    cy.get('#search-topology-element-input').type(`${c.namespace}{enter}`);
    //cy.get('.node-highlighted').should('exist');

    //should show the drawer
    cy.get('.pf-c-drawer__panel-main').should('exist');
    cy.get('#pf-tab-metrics-drawer-tabs').click();
    cy.get('.element-metrics-container').should('exist');
    cy.get('.pf-c-chart').should('exist');

    //close drawer
    cy.get('.pf-c-drawer__close').click();
    cy.get('.pf-c-drawer__panel-main').should('not.exist');
  });

  it('update options', () => {
    //open options panel
    cy.showAdvancedOptions();
    cy.showDisplayOptions();

    //select some displays
    cy.wait(c.waitTime);
    cy.dropdownSelect('layout-dropdown', 'Cola');
    cy.wait(c.waitTime);
    cy.dropdownSelect('layout-dropdown', 'Dagre');
    cy.wait(c.waitTime);
    cy.dropdownSelect('layout-dropdown', 'Concentric');
    cy.wait(c.waitTime);
    cy.dropdownSelect('layout-dropdown', 'Grid');
    cy.wait(c.waitTime);


    //select some scopes / groups
    cy.dropdownSelect('scope-dropdown', 'host');
    cy.get('#group-dropdown').should('be.disabled');

    cy.wait(c.waitTime);
    cy.dropdownSelect('scope-dropdown', 'namespace');
    cy.wait(c.waitTime);
    cy.dropdownSelect('group-dropdown', 'hosts');
    cy.wait(c.waitTime);
    cy.dropdownSelect('scope-dropdown', 'owner');
    cy.wait(c.waitTime);
    cy.dropdownSelect('group-dropdown', 'namespaces');
    cy.wait(c.waitTime);
    cy.dropdownSelect('scope-dropdown', 'resource');
    cy.wait(c.waitTime);
    cy.dropdownSelect('group-dropdown', 'owners');
    cy.wait(c.waitTime);

    //toggle switches
    cy.get('#group-collapsed-switch').click();
    cy.dropdownSelect('group-dropdown', 'none');
    cy.get('#group-collapsed-switch').should('be.disabled');

    cy.get('#edges-tag-switch').should('not.be.disabled');
    cy.get('#edges-tag-switch').click();
    cy.get('#edges-switch').click();
    cy.get('#edges-tag-switch').should('be.disabled');

    cy.get('#badge-switch').click();

    cy.dropdownSelect('truncate-dropdown', '10');
  });
})
