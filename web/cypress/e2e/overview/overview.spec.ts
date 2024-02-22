/// <reference types="cypress" />

import * as c from '../../support/const';

describe('netflow-overview', () => {
  beforeEach(() => {
    cy.openNetflowTrafficPage();
    //clear default app filters
    cy.get('#clear-all-filters-button').click();
  });

  it('displays overview and panels', () => {
    cy.get('#overview-container').should('exist');
    cy.checkPanels();
  });

  it('manage panels', () => {
    //first open modal
    cy.openPanelsModal();

    //Select all panels
    cy.get('#overview-panels-modal').contains('Select all').click();

    //Save
    cy.get('#overview-panels-modal').contains('Save').click();
    cy.checkPanels(c.availablePanelsCount);

    //reopen modal
    cy.openPanelsModal();

    //Unselect all panels
    cy.get('#overview-panels-modal').contains('Unselect all').click();

    //Save should be disabled
    cy.get('#overview-panels-modal').contains('Save').should('be.disabled');

    //Select some panels
    cy.selectPopupItems('#overview-panels-modal', ['Top X average packets rates (donut)']);

    //Save new panels
    cy.get('#overview-panels-modal').contains('Save').click();

    //Should have 1 panel
    cy.checkPanels(1);

    //reopen modal
    cy.openPanelsModal();

    //Restore default panels
    cy.get('#overview-panels-modal').contains('Restore default panels').click();

    //Save default panels
    cy.get('#overview-panels-modal').contains('Save').click();
    cy.checkPanels();
  });
})
