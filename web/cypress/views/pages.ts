import { listPage } from "@views/list-page";
import { guidedTour } from '@views/tour';

export const Pages = {
  gotoProjectsList: () => {
    cy.visit('/k8s/cluster/project.openshift.io~v1~Project');
    listPage.rows.shouldBeLoaded();
  },
  gotoProjectCreationPage: () => {
    cy.visit('k8s/cluster/project.openshift.io~v1~Project');
    cy.get('[data-test="item-create"]').click();
    cy.get('form[name="form"]').should('be.visible');
  },
  gotoOneProjectAccessTab: (namespace: string) => {
    cy.switchPerspective('Developer');
    cy.visit(`/project-details/ns/${namespace}/access`);
    guidedTour.close();
    cy.get('a[data-test-id="horizontal-link-Project access"]').should('be.visible');
  },
  gotoPVCCreationPage: (namespace: string) => {
    cy.visit(`/k8s/ns/${namespace}/core~v1~PersistentVolumeClaim`);
    cy.get('[data-test="item-create"]').click();
    cy.get('form').should('be.visible');
  },
  gotoPVCDetailsPage: (namespace: string, pvc_name: string) => {
    cy.visit(`/k8s/ns/${namespace}/persistentvolumeclaims/${pvc_name}`);
    cy.get('[data-test-section-heading="PersistentVolumeClaim details"]').should('exist');
  },
  gotoNamespacesList: () => {
    cy.visit('/k8s/cluster/core~v1~Namespace');
    listPage.rows.shouldBeLoaded();
  },
  gotoSearch: () => {
    cy.visit('/search/all-namespaces');
  },
  gotoImagePullSecretCreation: (namespace) => {
    cy.visit(`/k8s/ns/${namespace}/secrets/~new/image`);
  },
  gotoSourceSecretCreation: (namespace) => {
    cy.visit(`/k8s/ns/${namespace}/secrets/~new/source`)
  },
  gotoAPIExplorer: () => {
    cy.visit('/api-explorer');
    cy.get('table').should('be.visible');
  },
  gotoCreateDeploymentFormView: (namespace: string) => {
    cy.visit(`/k8s/ns/${namespace}/deployments/~new/form`);
    cy.get('[data-test="form-view-input"]').click({force: true});
    cy.get('[data-test="section name"]').should("exist");
  },
  gotoCreateDeploymentYamlView: (namespace: string) => {
    cy.visit(`/k8s/ns/${namespace}/deployments/~new/form`);
    cy.get('[data-test="yaml-view-input"]').click({force: true});
    cy.get('[data-test="yaml-editor"]').should("exist");
  },
  gotoCreateDeploymentconfigsFormView: (namespace: string) => {
    cy.visit(`/k8s/ns/${namespace}/deploymentconfigs/~new/form`);
    cy.get('[data-test="form-view-input"]').click({force: true});
    cy.get('[data-test="section name"]').should("exist");
  },
  gotoCreateDeploymentconfigsYamlView: (namespace: string) => {
    cy.visit(`/k8s/ns/${namespace}/deploymentconfigs/~new/form`);
    cy.get('[data-test="yaml-view-input"]').click({force: true});
    cy.get('[data-test="yaml-editor"]').should("exist");
  },
  gotoDeploymentsList: () => {
    cy.visit('/k8s/all-namespaces/apps~v1~Deployment');
    listPage.rows.shouldBeLoaded();
  },
  gotoDeploymentConfigList: (namespace: string) => {
    cy.visit(`/k8s/ns/${namespace}/apps.openshift.io~v1~DeploymentConfig`);
  },
  gotoDeploymentConfigDetailsTab: (namespace: string, dcname: string)=> {
    cy.visit(`/k8s/ns/${namespace}/deploymentconfigs/${dcname}`);
  },
  gotoPodsList: (namespace?) => {
    if (namespace) {
      cy.visit(`/k8s/ns/${namespace}/core~v1~Pod`);
    } else {
      cy.visit('/k8s/all-namespaces/core~v1~Pod');
    }
    listPage.rows.shouldBeLoaded();
  },
  gotoOneContainerPage: (namespace, podname, containername) => {
    cy.visit(`/k8s/ns/${namespace}/pods/${podname}/containers/${containername}`);
  },
  gotoClusterOperatorsList: () => {
    cy.visit('/settings/cluster/clusteroperators');
    listPage.rows.shouldBeLoaded();
  },
  gotoClusterDetailspage: () => {
    cy.visit('settings/cluster');
    cy.get('[data-test-id="horizontal-link-Details"]').should('be.visible');
  },
  gotoCRDsList: () => {
    cy.visit('/k8s/cluster/apiextensions.k8s.io~v1~CustomResourceDefinition');
    listPage.rows.shouldBeLoaded();
  },
  gotoOneCRDDetailsPage: (crdname) => {
    cy.visit(`/k8s/cluster/customresourcedefinitions/${crdname}`);
    cy.get('[data-test-id="horizontal-link-Details"]').should('be.visible');
  },
  gotoOneNetworkPolicyDetails: (namespace: string, npname: string) => {
    cy.visit(`/k8s/ns/${namespace}/networkpolicies/${npname}`);
  },
  gotoConfigMapDetailsYamlTab:(namespace: string, cmname: string) => {
    cy.visit(`/k8s/ns/${namespace}/configmaps/${cmname}/yaml`);
  },
  gotoUsers: () => {
    cy.visit('/k8s/cluster/user.openshift.io~v1~User');
    listPage.rows.shouldBeLoaded();
  },
  gotoGroupListPage: () => {
    cy.visit('/k8s/cluster/user.openshift.io~v1~Group');
    listPage.rows.shouldBeLoaded();
  },
  gotoOneGroupPage: (groupName: string) => {
    cy.visit(`/k8s/cluster/user.openshift.io~v1~Group/${groupName}`);
    cy.get('[data-test-section-heading="Group details"]').should('be.visible');
  },
  gotoNodeOverviewPage: (nodeName: string) => {
    cy.visit(`/k8s/cluster/nodes/${nodeName}/`);
    cy.get('[data-test-id="dashboard"]').should('be.visible');
  },
  gotoMCPListPage: () => {
    cy.visit("/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfigPool");
  },
  gotoMCPDetailsPage: (mcpname: string) => {
    cy.visit(`/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfigPool/${mcpname}`)
  },
  gotoMachineConfigDetailsPage: (mc_name: string) => {
    cy.visit(`/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig/${mc_name}`);
    cy.get('[data-test-id="resource-summary"]').should('be.visible');
  },
  gotoCatalogSourcePage: () => {
    cy.visit('/k8s/ns/openshift-marketplace/operators.coreos.com~v1alpha1~CatalogSource/custom-catalogsource');
    cy.contains('READY', {timeout: 120000 }).should('exist');
  },
  gotoOperatorHubPage: (namespace: string = 'default') => {
    const url = namespace === 'default' ?
      '/catalog/ns/default?catalogType=operator':
      `/catalog/ns/${namespace}?catalogType=operator`;
    cy.visit(url);
    cy.get('.co-catalog-page__num-items', {timeout: 120000}).should('exist');
  },
  gotoInstalledOperatorPage: (namespace: string = 'all-namespaces') => {
    const url = namespace === 'all-namespaces' ?
      '/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion':
      `/k8s/ns/${namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion`;
    cy.visit(url);
    cy.contains('Installed Operators').should('exist');
  },
  gotoInstalledExtensionsPage: () => {
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1alpha1~ClusterExtension');
  },
  gotoVolumeSnapshotListPage: (namespace: string) => {
    cy.visit(`/k8s/ns/${namespace}/snapshot.storage.k8s.io~v1~VolumeSnapshot`);
  },
  gotoVolumeSnapshotDetailPage: (namespace ,vs_name) => {
    cy.visit(`/k8s/ns/${namespace}/snapshot.storage.k8s.io~v1~VolumeSnapshot/${vs_name}`);
    cy.get('[data-test-section-heading="VolumeSnapshot details"]').should('exist');
  },
  addLabelFromResourcePage: (label) => {
    cy.byTestID('Labels-details-item__edit-button').click();
    cy.get('#tags-input').type(`${label}`);
    cy.byTestID('confirm-action').click();
  },
  checkDynamicConsolePluginDetails: (displayName, description, version, loadStatus, renderStatus, CSPStatus, backendService, proxyService) => {
    cy.get('[data-test-selector$="Display Name"]').contains(`${displayName}`);
    cy.get('[data-test-selector$="Description"]').contains(`${description}`);
    cy.get('[data-test-selector$="Version"]').contains(`${version}`);
    cy.get('[data-test-selector$="Status"]').contains(`${loadStatus}`);
    cy.get('[data-test-selector$="Enabled"]').contains(`${renderStatus}`);
    cy.get('[data-test-selector$="CSP Violations"]').contains(`${CSPStatus}`);
    cy.get('[data-test-selector$="Backend Service"]').contains(`${backendService}`);
    cy.get('[data-test-selector$="Proxy Services"]').contains(`${proxyService}`);
  },
  checkPageError: (errorMsg) => {
    cy.contains('h1', `${errorMsg}`).should('exist');
  },
  checkPageLink: (linkHref, linkText) => {
    cy.get(`[href="${linkHref}"]`).should('contain', `${linkText}`);
  }
}
