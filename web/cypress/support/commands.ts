/* eslint-disable @typescript-eslint/no-namespace */

/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

import * as c from './const';

Cypress.Commands.add('openNetflowTrafficPage', (clearCache = true) => {
  if (clearCache) {
    //clear local storage to ensure to be in default view = overview
    cy.clearLocalStorage();
  }
  cy.visit(c.url);
  cy.get("#netflow-traffic-nav-item-link").click();
});

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

Cypress.Commands.add('showDisplayOptions', () => {
  cy.get('#display-dropdown-container').children().first()
    .then(function ($div) {
      if ($div.hasClass('pf-m-expanded')) {
        return;
      } else {
        cy.get('#display-dropdown-container').click();
      }
    })
});

Cypress.Commands.add('checkPanels', (panels = c.defaultPanelsCount) => {
  cy.get('#overview-flex').children().its('length').should('eq', panels);
});

Cypress.Commands.add('openPanelsModal', () => {
  cy.showAdvancedOptions();
  cy.get('#manage-overview-panels-button').click();
  cy.get('#overview-panels-modal').should('exist');
  cy.get('#overview-panels-modal').find('.pf-v5-c-data-list__item-content').should('have.length', c.availablePanelsCount);
});

Cypress.Commands.add('checkColumns', (groups = c.defaultColumnGroupCount, cols = c.defaultColumnCount) => {
  if (groups === 0) {
    //Should not have nested columns
    cy.get('thead>tr').should('have.length', 1);

    //Should have correct number of columns
    cy.get('thead>tr').children().should('have.length', cols);
  } else {
    //Should have nested columns
    cy.get('#table-container').get('thead>tr').should('have.length', 2);

    //Should have correct number of groups (regrouping of several columns)
    cy.get('thead>tr').eq(0).children().should('have.length', groups);
    //Should have correct number of columns
    cy.get('thead>tr').eq(1).children().should('have.length', cols);
  }
});

Cypress.Commands.add('openColumnsModal', () => {
  cy.showAdvancedOptions();
  cy.get('#manage-columns-button').click();
  cy.get('#columns-modal').should('exist');
  cy.get('#columns-modal').find('.pf-v5-c-data-list__item-content').should('have.length', c.availableColumnCount);
});

Cypress.Commands.add('selectPopupItems', (id, names) => {
  for (let i = 0; i < names.length; i++) {
    cy.get(id).get('.modal-body').contains(names[i])
      .closest('.pf-v5-c-data-list__item-row').find('.pf-v5-c-data-list__check').click();
  }
});

Cypress.Commands.add('checkPopupItems', (id, ids) => {
  for (let i = 0; i < ids.length; i++) {
    cy.get(id).find('.modal-body').find(`#${ids[i]}`).check();
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
  cy.get('.pf-v5-c-menu__content').should('exist');
  cy.get('.pf-v5-c-menu__content').find(`#${name}`).click();
});

Cypress.Commands.add('checkContent', (topology) => {
  if (topology) {
    cy.get('[data-layer-id="default"]').children().its('length').should('be.gte', 5);
  } else {
    cy.get('#table-container').find('tr').its('length').should('be.gte', 5);
  }
});

Cypress.Commands.add('addFilter', (filter, value, topology) => {
  cy.get('[aria-label="Open advanced search"]').click();
  cy.get('#column-filter-toggle').click();
  cy.get('#column-filter-dropdown').find(`#${filter}`).click();
  cy.get('#column-filter-dropdown').should('not.exist');
  cy.get('input[type="search"]').type(`${value}{enter}`);
  cy.checkContent(topology);
});

Cypress.Commands.add('changeQueryOption', (name, topology) => {
  cy.get('#filter-toolbar-search-filters').contains('Query options').click();
  cy.get('#query-options-dropdown').contains(name).click();
  cy.get('#filter-toolbar-search-filters').contains('Query options').click();
  cy.checkContent(topology);
});

Cypress.Commands.add('changeTimeRange', (name, topology) => {
  cy.get('#time-range-dropdown-dropdown').click();
  cy.get('.pf-v5-c-menu__content').contains(name).click();
  cy.checkContent(topology);
});

Cypress.Commands.add('clickShowDuplicates', () => {
  cy.showAdvancedOptions();
  cy.showDisplayOptions();
  cy.get('#table-display-dropdown').contains('Show duplicates').click();
  cy.checkContent();
});

Cypress.Commands.add('changeMetricType', (name) => {
  cy.showAdvancedOptions();
  cy.showDisplayOptions();

  cy.get('#metricType-dropdown').click();
  cy.get('.pf-v5-c-menu__content').contains(name).click();
  
  // For Packets metric, we expect a full page error due to mock timeout
  if (name === 'Packets') {
    cy.get('[data-test="error-state"]').should('exist');
  } else {
    // For other metrics (Bytes, etc.), we expect the topology to render successfully
    cy.get('[data-layer-id="default"]').children().its('length').should('be.gte', 5);
  }
});

Cypress.Commands.add('checkRecordField', (field, name, values) => {
  cy.get(`[data-test-id="drawer-field-${field}"]`).contains(name);
  values.forEach(v => {
    cy.get(`[data-test-id="drawer-field-${field}"]`)
      .children('.record-field-content,.record-field-flex-container')
      .should('contain', v);
  });
});


Cypress.Commands.add('setupNetworkIdleTracking', (method: string = 'GET', urlPattern: string = '/api/**') => {
  cy.wrap({
    requestCount: 0,
    lastRequestTime: 0,
    startTime: Date.now()
  }).as('networkIdleTracker');

  cy.intercept(method, urlPattern, (req) => {
    cy.get('@networkIdleTracker').then((tracker: Cypress.networkIdleTracker) => {
      tracker.requestCount++;
      tracker.lastRequestTime = Date.now();
    });
    req.continue();
  }).as('networkIdleActivity');
});


Cypress.Commands.add('waitForNetworkIdle', (idleTime: number = 3000, timeout: number = 120000) => {
  cy.get('@networkIdleTracker', { timeout: timeout })
    .then((tracker: Cypress.networkIdleTracker) => {
      const startTime = Date.now();

      const checkIdleCondition = () => {
        const now = Date.now();

        if (tracker.requestCount > 0 && (now - tracker.lastRequestTime) >= idleTime) {
          return true;
        }

        if (tracker.requestCount === 0 && (now - startTime) >= idleTime) {
          return true;
        }

        if (now - startTime > timeout) {
          throw new Error('Timed out waiting for network idle.');
        }

        return false; 
      };

      const pollUntilIdle = () => {
        const isIdle = checkIdleCondition();

        if (isIdle) {
          return;
        } else {
          return cy.wait(1000, { log: false }).then(pollUntilIdle);
        }
      };

      return cy.then(pollUntilIdle);
    });
});

declare global {
  namespace Cypress {
    interface Chainable {
      openNetflowTrafficPage(clearCache?: boolean): Chainable<void>
      showAdvancedOptions(): Chainable<void>
      showDisplayOptions(): Chainable<void>
      checkPanels(panels?: number): Chainable<void>
      openPanelsModal(): Chainable<void>
      checkColumns(groups?: number, cols?: number): Chainable<void>
      openColumnsModal(): Chainable<void>
      selectPopupItems(id: string, names: string[]): Chainable<void>
      checkPopupItems(id: string, ids: string[]): Chainable<void>
      sortColumn(name: string): Chainable<void>
      dropdownSelect(id: string, name: string): Chainable<void>
      checkContent(topology?: boolean): Chainable<void>
      addFilter(filter: string, value: string, topology?: boolean): Chainable<void>
      changeQueryOption(name: string, topology?: boolean): Chainable<void>
      changeTimeRange(name: string, topology?: boolean): Chainable<void>
      changeMetricType(name: string): Chainable<void>
      checkRecordField(field: string, name: string, values: string[]): Chainable<void>
      clickShowDuplicates():Chainable<void>

      /**
       * Sets up network interception to track active requests for idle detection.
       * This command *must* be called before `cy.waitForNetworkIdle`
       *
       * @param method HTTP method to intercept (default: 'GET')
       * @param urlPattern URL pattern to intercept (default: '/api/**')
       */
      setupNetworkIdleTracking(method?: string, urlPattern?: string): Chainable<void>

      /**
       * Waits until no intercepted requests (matching the patterns
       * set in `setupNetworkIdleTracking`) have been active for `idleTime`,
       * or until the `timeout` is reached.
       *
       * @param idleTime How long the network must be idle (in ms)
       * @param timeout Total time to wait before timing out (in ms)
       */
      waitForNetworkIdle(idleTime?: number, timeout?: number): Chainable<void>

      networkIdleTracker: {
        requestCount: number;
        lastRequestTime: number;
        startTime: number;
      };
    }
  }
}
