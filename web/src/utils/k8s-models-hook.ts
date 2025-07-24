import { useK8sModels } from '@openshift-console/dynamic-plugin-sdk';

export function useK8sModelsWithColors() {
  const [k8sModels, inFlight] = useK8sModels();

  function setColor(kind: string, color: string) {
    if (k8sModels && k8sModels[kind]) {
      k8sModels[kind].color = color;
    }
  }

  if (k8sModels && !inFlight) {
    /* This part inject missing colors in k8sModels
     * check console/frontend/public/style/_vars.scss for values
     */
    //$color-application-dark = $pf-v5-color-green-500 = #3E8635
    setColor('Application', '#3E8635');

    //$color-rbac-role-dark = $pf-v5-color-gold-600 = #795600
    setColor('ClusterRole', '#795600');
    setColor('Role', '#795600');

    //$color-rbac-binding-dark = $pf-v5-color-light-blue-500 = #008BAD
    setColor('ClusterRoleBinding', '#008BAD');
    setColor('RoleBinding', '#008BAD');

    //$color-pod-overlord = $pf-v5-color-blue-500 = #004080
    setColor('DaemonSet', '#004080');
    setColor('Deployment', '#004080');
    setColor('DeploymentConfig', '#004080');
    setColor('Job', '#004080');
    setColor('PetSet', '#004080');
    setColor('ReplicaSet', '#004080');
    setColor('ReplicationController', '#004080');

    //$color-node-dark = $pf-v5-color-purple-400 = #8476D1
    setColor('Machine', '#8476D1');
    setColor('MachineAutoscaler', '#8476D1');
    setColor('MachineClass', '#8476D1');
    setColor('MachineConfig', '#8476D1');
    setColor('MachineConfigPool', '#8476D1');
    setColor('MachineDeployment', '#8476D1');
    setColor('MachineHealthCheck', '#8476D1');
    setColor('MachineSet', '#8476D1');
    setColor('Node', '#8476D1');
    setColor('Policy', '#8476D1');

    //$color-configmap-dark = $pf-v5-color-purple-600 = #40199A
    setColor('AlertRule', '#40199A');
    setColor('ConfigMap', '#40199A');
    //$color-serviceaccount-dark = $color-configmap-dark
    setColor('ServiceAccount', '#40199A');

    //$color-container-dark = $pf-v5-color-blue-300 = #2B9AF3
    setColor('Alert', '#2B9AF3');
    setColor('Container', '#2B9AF3');

    //$color-pod-dark = $pf-v5-color-cyan-300 = #009596
    setColor('Pod', '#009596');

    //$color-namespace-dark = $pf-v5-color-green-600 = #1E4F18
    setColor('Namespace', '#1E4F18');
    setColor('Project', '#1E4F18');

    //$color-secret-dark = $pf-v5-color-orange-400 = #C46100
    setColor('Secret', '#C46100');

    //$color-alertmanager-dark = $pf-v5-color-orange-600 = #773D00
    setColor('AlertManager', '#773D00');

    //$color-service-dark = $pf-v5-color-light-green-500 = #3E8635
    setColor('Service', '#3E8635');

    //$color-ingress-dark = $pf-v5-color-purple-700 = #1F0066
    setColor('Ingress', '#1F0066');
  }

  return k8sModels;
}

export function useK8sModel(group: string, version: string, kind: string) {
  const [k8sModels] = useK8sModels();
  return k8sModels[`${group}~${version}~${kind}`];
}
