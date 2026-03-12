/**
 * Simplified navigation helpers for NetObserv Cypress tests
 * Based on OpenShift Console integration-tests-cypress/views/nav.ts
 */

export enum SwitchPerspective {
  Developer = 'Developer',
  Administrator = 'Core platform',
}

/**
 * Checks if the Developer perspective is available and enables it if needed
 */
const checkDeveloperPerspective = () => {
  cy.get('body').then(($body) => {
    cy.byLegacyTestID('perspective-switcher-toggle').then(($switcher) => {
      // switcher is present
      if ($switcher.attr('aria-hidden') !== 'true') {
        cy.byLegacyTestID('perspective-switcher-toggle').click();

        if ($body.find('[data-test-id="perspective-switcher-menu-option"]').length !== 0) {
          cy.log('perspective switcher menu enabled');
          cy.byLegacyTestID('perspective-switcher-menu-option').contains('Developer');
          cy.byLegacyTestID('perspective-switcher-toggle').click();
          return;
        }
      }

      cy.exec(
        `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Enabled"}}]}}}'`,
        { failOnNonZeroExit: true },
      ).then((result) => {
        cy.log(result.stdout);
        cy.log(result.stderr);
      });
      cy.exec(`oc rollout status -w deploy/console -n openshift-console`, {
        failOnNonZeroExit: true,
      }).then((result) => {
        cy.log(result.stderr);
      });
      cy.reload(true);
      cy.document().its('readyState').should('eq', 'complete');
      cy.log('perspective switcher menu refreshed');
    });
  });
};

/**
 * Waits for the document to be fully loaded
 */
const waitForDocumentLoad = () => {
  cy.document().its('readyState').should('eq', 'complete');
};

/**
 * Navigation helper object
 */
export const nav = {
  sidenav: {
    switcher: {
      /**
       * Verifies that the perspective switcher has the expected text
       */
      shouldHaveText: (text: string) => {
        cy.byLegacyTestID('perspective-switcher-toggle').then(($body) => {
          if (text === SwitchPerspective.Administrator) {
            // if the switcher is hidden it means we are in the admin perspective
            if ($body.attr('id') === 'core-platform-perspective') {
              cy.log('Admin is the only perspective available');
              cy.byLegacyTestID('perspective-switcher-toggle').should('be.visible');
              return;
            }
          }
          cy.byLegacyTestID('perspective-switcher-toggle').contains(text);
        });
      },
      /**
       * Changes the current perspective to the specified one
       */
      changePerspectiveTo: (newPerspective: string) => {
        waitForDocumentLoad();
        switch (newPerspective) {
          case 'Core platform':
          case 'core platform':
          case 'Admin':
          case 'admin':
            cy.byLegacyTestID('perspective-switcher-toggle').then(($body) => {
              if ($body.attr('id') === 'core-platform-perspective') {
                cy.log('Admin is the only perspective available');
                cy.byLegacyTestID('perspective-switcher-toggle').should('be.visible');
                return;
              }

              if ($body.text().includes('Core platform')) {
                cy.log('Already on admin perspective');
                cy.byLegacyTestID('perspective-switcher-toggle')
                  .scrollIntoView()
                  .contains(newPerspective);
              } else {
                cy.byLegacyTestID('perspective-switcher-toggle')
                  .click()
                  .byLegacyTestID('perspective-switcher-menu-option')
                  .contains(newPerspective)
                  .click({ force: true });
              }
            });
            break;
          case 'Developer':
          case 'developer':
          case 'Dev':
          case 'dev':
            cy.byLegacyTestID('perspective-switcher-toggle')
              .should('be.visible')
              .then(($body) => {
                if ($body.text().includes('Developer')) {
                  cy.log('Already on dev perspective');
                  cy.byLegacyTestID('perspective-switcher-toggle')
                    .scrollIntoView()
                    .contains(newPerspective);
                } else {
                  checkDeveloperPerspective();
                  cy.byLegacyTestID('perspective-switcher-toggle')
                    .click()
                    .byLegacyTestID('perspective-switcher-menu-option')
                    .contains(newPerspective)
                    .click({ force: true });
                }
              });
            break;
          default:
            cy.byLegacyTestID('perspective-switcher-toggle')
              .click()
              .byLegacyTestID('perspective-switcher-menu-option')
              .contains(newPerspective)
              .click({ force: true });
        }
      },
    },
    clusters: {
      shouldHaveText: (text: string) => cy.byLegacyTestID('cluster-dropdown-toggle').contains(text),
      changeClusterTo: (newCluster: string) =>
        cy
          .byLegacyTestID('cluster-dropdown-toggle')
          .click()
          .byLegacyTestID('cluster-dropdown-item')
          .contains(newCluster)
          .click(),
    },
    shouldHaveNavSection: (path: string[]) => {
      cy.get('#page-sidebar').contains(path[0]);
      if (path.length === 2) {
        cy.get('#page-sidebar').contains(path[1]);
      }
    },
    shouldNotHaveNavSection: (path: string[]) => {
      cy.get('#page-sidebar').should('not.have.text', path[0]);
      if (path.length === 2) {
        cy.get('#page-sidebar').should('not.have.text', path[1]);
      }
    },
    clickNavLink: (path: string[]) => cy.clickNavLink(path),
  },
};
