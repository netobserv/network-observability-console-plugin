export namespace podsPageUtils {
  export function setProjectPodNamesAlias(project, label, aliasPrefix, pod_label_key = "name") {
    cy.visit(`/k8s/ns/${project}/pods`).get('tr').should('be.visible')
    cy.get('#content-scrollable').within(() => {
      cy.get('button.pf-c-dropdown__toggle')
        .should('have.text', 'Name')
        .click()
        .get('#LABEL-link')
        .click()
      cy.byLegacyTestID('item-filter')
        .type(`${pod_label_key}=${label}`)
        .get('span.co-text-node')
        .contains(label)
        .should('be.visible')
        .click()
      cy.get('tr > td[id=name]').find('a').each(($el, $index) => {
        cy.wrap($el).invoke('text').as(`${aliasPrefix}_pod${$index}Name`)
      })
    })
  }
  export function setPodIPAlias(project, podName) {
    cy.visit(`./k8s/ns/${project}/pods/${podName}`)
      .byTestSelector('details-item-value__Pod IP')
      .should('be.visible')
      .invoke('text')
      .as(`${podName}IP`)
  }
}

export const podsPage = {
  goToPodsInAllNamespaces: () => {
    cy.visit('/k8s/all-namespaces/pods');
    cy.get('tr[data-test-rows="resource-row"]').should('exist');
  },
  goToPodsForGivenNamespace: (namespace: String) => {
    cy.visit('/k8s/ns/'+namespace+'/pods');
    cy.get('tr[data-test-rows="resource-row"]').should('exist');
  },
  // this is to make sure the page is loaded,
  // the pods page is loaded when the columns are displayed hence checking for this condition
  isLoaded: () => {
    cy.get('tr[data-test-rows="resource-row"]').should('exist')
  },
  goToPodDetails: (namespace, podName) => {
    cy.visit('/k8s/ns/'+namespace+'/pods/'+podName);
  },
  goToPodsMetricsTab: (namespace: string, podname: string) => {
    cy.visit(`/k8s/ns/${namespace}/pods/${podname}/metrics`)
  },
  goToPodsLogTab: (namespace:string, podname: string) => {
    cy.visit(`/k8s/ns/${namespace}/pods/${podname}/logs`)
  },
  checkContainerLastStateOnPodPage: (containerName, lastState) => {
    cy.get(`tr td:contains("${containerName}")`).siblings(`td:contains('${lastState}')`).should('exist');
  },
  checkContainerLastStateOnContainerPage: (lastState) => {
    cy.get('dt:contains("Last State")').next('dd').should('contain',`${lastState}`);
  },
  checkpodstatus: (podname, podstatus, readycount) => {
    cy.get(`td:contains(${podname})`).next(`td[data-label="status"]:contains(${podstatus})`).next('td[data-label="ready"]').should('contain',`${readycount}`);
  }
}

export const podsMetricsTab ={
  checkMetricsURL: (pos: number, chart: RegExp, chartdetails?: RegExp) =>{
    cy.get('[aria-label="View in query browser"]')
      .eq(pos)
      .should('have.attr','href')
      .and('match',chart)
      .and('match',chartdetails)
  },
  clickToMetricsPage: (pos: number,chart: RegExp) => {
    cy.get('[aria-label="View in query browser"]')
      .eq(pos)
      .should('have.attr','href')
      .and('match',chart)
      .then((href) => {
        cy.visit(href)
    })
  },
  checkMetricsLoaded: () => {
    const maxRetries = 8;
    const pageLoadingDelay = 20000; // 20 seconds
    const retryDelay = 30000; //30 seconds
    const textToCheck = 'No datapoints found';
    const checkMetricsContent = ($metrics, retryCount = 0) => {
      const checkNoDataPointsFound = $metrics.toArray().every(el => {
        const metricText = Cypress.$(el).text().trim();
        const containsText = !metricText.includes(textToCheck);
        if (metricText === '') {
          return false;
        }
        cy.log(`METRIC TEXT: ${metricText} include/uninclude "${textToCheck}": return ${containsText}`);
        return containsText;
      });

      if (!checkNoDataPointsFound) {
        if (retryCount === maxRetries) {
          cy.log("Max retries exceeded, not all metrics/metric data loaded as expected");
          throw new Error('Max retries exceeded, not all metrics/metric data loaded as expected');
        }
        cy.wait(retryDelay).then(() => {
          cy.log("Not all chart data is ready, trigger page reload");
          cy.reload();
          cy.wait(pageLoadingDelay) // wait for page loading success
          cy.get('[aria-label="View in query browser"]').should('have.length', 5).then(($els) => {
            checkMetricsContent($els, retryCount + 1);
          });
        });
      } else {
        cy.log('All metrics Loaded. And chart do not contain "no datapoints found"');
      }
    }
    cy.wait(pageLoadingDelay) // wait for page loading success
    cy.get('[aria-label="View in query browser"]').should('have.length', 5).then(($els) => {
      checkMetricsContent($els);
    });
  }
}
