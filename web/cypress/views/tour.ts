export const guidedTour = {
    close: () => {
        cy.get('body').then(() => {
            if (Cypress.$("#guided-tour-modal").length > 0) {
                cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
            }
        });
    }
};
