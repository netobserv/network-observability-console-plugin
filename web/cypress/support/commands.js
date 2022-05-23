// ***********************************************
// This commands.js file
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import * as c from './const'

Cypress.Commands.add('openNetflowTrafficPage', () => {
  //clear local storage to ensure to be in default view = table
  cy.clearLocalStorage();
  cy.visit(c.url);
});

Cypress.Commands.add('checkColumns', (groups = 5, cols = 9) => {
  if (groups === 0) {
    //Should not have nested columns
    cy.get('thead>tr').should('have.length', 1);

    //Should have correct number of columns
    cy.get('thead>tr').children().should('have.length', cols);
  } else {
    //Should have nested columns
    cy.get('thead>tr').should('have.length', 2);

    //Should have correct number of groups
    cy.get('thead>tr').eq(0).children().should('have.length', groups);
    //Should have correct number of columns
    cy.get('thead>tr').eq(1).children().should('have.length', cols);
  }
});

Cypress.Commands.add('openColumnsModal', () => {
  cy.get('#manage-columns-button').click();
  cy.get('#columns-modal').should('exist');
});

Cypress.Commands.add('selectColumns', (names) => {
  for (let i = 0; i < names.length; i++) {
    cy.get('.modal-body').contains(names[i]).click();
  }
});

Cypress.Commands.add('sortColumn', (name) => {
  cy.get('thead').contains(name).click();
  cy.get('[aria-sort="ascending"]').should('have.length', 1);
  cy.get('[aria-sort="descending"]').should('have.length', 0);
  cy.get('thead').contains(name).click();
  cy.get('[aria-sort="ascending"]').should('have.length', 0);
  cy.get('[aria-sort="descending"]').should('have.length', 1);
});

Cypress.Commands.add('dropdownSelect', (id, name) => {
  cy.get(`#${id}`).click();
  cy.get('.pf-c-dropdown__menu').should('exist');
  cy.get('.pf-c-dropdown__menu').find(`#${name}`).click();
});

Cypress.Commands.add('checkContent', (topology) => {
  if (topology) {
    cy.get('[data-layer-id="default"]').children().its('length').should('be.gte', 5);
  } else {
    cy.get('#table-container').find('tr').its('length').should('be.gte', 5);
  }
});

Cypress.Commands.add('addCommonFilter', (filter, value, topology) => {
  cy.get('#column-filter-toggle').click();
  cy.get('.pf-c-accordion__expanded-content-body').find(`#${filter}`).click();
  cy.get('.pf-c-accordion__expanded-content-body').should('not.exist');
  cy.get('#column-filter-dropdown').parent().children().eq(1).type(`${value}{enter}`);
  cy.checkContent(topology);
});

Cypress.Commands.add('changeQueryOption', (name, topology) => {
  cy.get('[aria-label="Options menu"]').click();
  cy.get('#query-options-dropdown').contains(name).click();
  cy.get('[aria-label="Options menu"]').click();
  cy.checkContent(topology);
});

Cypress.Commands.add('changeTimeRange', (name, topology) => {
  cy.get('#time-range-dropdown-dropdown').click();
  cy.get('.pf-c-dropdown__menu').contains(name).click();
  cy.checkContent(topology);
});

Cypress.Commands.add('changeMetricFunction', (name) => {
  cy.get('#metricFunction-dropdown').click();
  cy.get('.pf-c-dropdown__menu').contains(name).click();
  cy.get('[data-layer-id="default"]').children().its('length').should('be.gte', 5);
});

Cypress.Commands.add('changeMetricType', (name) => {
  cy.get('#metricType-dropdown').click();
  cy.get('.pf-c-dropdown__menu').contains(name).click();
  cy.get('[data-layer-id="default"]').children().its('length').should('be.gte', 5);
});