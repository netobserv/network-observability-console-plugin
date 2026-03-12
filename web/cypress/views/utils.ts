export namespace helperfuncs {
    export function getRandomName() {
        return [...Array(10)].map(i => (~~(Math.random() * 36)).toString(36)).join('')
    }
    export function setNetworkProviderAlias() {
        cy.exec("oc get Network.config.openshift.io cluster -o json").then(result => {
            expect(result.stdout).to.be.not.empty
            const networkprovider = JSON.parse(result.stdout)
            cy.wrap(networkprovider.spec.networkType).as('networkprovider')
        })
    }
    export function clickIfExist(element) {
        cy.get('body').then((body) => {
            if (body.find(element).length > 0) {
                cy.get(element).click();
            }
        });
    }
}
export const actionList = {
  clickActionItem: (itemName) => {
    cy.byLegacyTestID('actions-menu-button').click();
    cy.get(`button[data-test-action="${itemName}"]`).click();
  },
  submitAction: () => cy.get('button[type="submit"]').click(),
}
