/// <reference types="cypress" />

import * as c from '../../support/const'

describe('netflow-table', () => {
  beforeEach(() => {
    cy.openNetflowTrafficPage();
    //move to table view
    cy.get('.tableTabButton').click();
    //clear default app filters
    cy.get('#clear-all-filters-button').click();
  });

  it('displays table and rows', () => {
    cy.get('#table-container').should('exist');
    //expect 100 results without filters
    cy.get('#table-container').find('tr').its('length').should('be.gte', 100);
    cy.get('#flowsCount').contains('100+ flows');

    cy.addCommonFilter('namespace', c.namespace);
    cy.addCommonFilter('name', c.pod);
    cy.changeQueryOption('Match all');
    cy.changeQueryOption('Both');
    cy.changeQueryOption('1000');
    cy.changeTimeRange('Last 1 day');
  });

  it('manage columns', () => {
    //first open modal
    cy.openColumnsModal();

    //Select all columns
    cy.get('#columns-modal').contains('Select all').click();

    //Save
    cy.get('#columns-modal').contains('Save').click();
    cy.checkColumns(24, 48);

    //reopen modal
    cy.openColumnsModal();

    //Unselect all columns
    cy.get('#columns-modal').contains('Unselect all').click();

    //Save should be disabled
    cy.get('#columns-modal').contains('Save').should('be.disabled');

    //Select some columns
    cy.selectPopupItems('#columns-modal', ['Start Time', 'Names', 'Packets']);

    //Save new columns
    cy.get('#columns-modal').contains('Save').click();

    //Should not have nested columns and have 3 columns
    cy.checkColumns(0, 3);

    //reopen modal
    cy.openColumnsModal();

    //add End Time, Owners, Ports
    //remove Packets
    cy.selectPopupItems('#columns-modal', ['End Time', 'Owners', 'Ports', 'Packets']);

    //Save new columns
    cy.get('#columns-modal').contains('Save').click();

    //Should not have nested columns and have 5 columns
    cy.checkColumns(0, 5);

    //reopen modal
    cy.openColumnsModal();

    //Restore default columns
    cy.get('#columns-modal').contains('Restore default columns').click();

    //Save default columns
    cy.get('#columns-modal').contains('Save').click();
    cy.checkColumns();
  });

  it('sort columns', () => {
    //TODO: check data after each sort
    cy.sortColumn('Name');
    cy.sortColumn('Namespace');
    cy.sortColumn('Port');
    cy.sortColumn('Packets');
  });
})
