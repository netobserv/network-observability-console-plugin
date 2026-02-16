export const catalog = {
  extensionCatalogLoaded: () => {
    cy.get('[data-test-group-name="source"]',{timeout: 60000}).should('exist');
    cy.get('a[class*="catalog-tile"]',{timeout: 60000}).should('exist');
  },
  filterBySource: (source_name) => {
    cy.get(`input[title="${source_name}"]`).check();
  }
}