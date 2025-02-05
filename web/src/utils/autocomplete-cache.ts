class AutoCompleteCache {
  private clusters: string[] | undefined = undefined;
  private udns: string[] | undefined = undefined;
  private zones: string[] | undefined = undefined;
  private namespaces: string[] | undefined = undefined;
  // Kinds are hard-coded for now.
  // The some other controller kinds might not be in the list (e.g. DeploymentConfig),
  // but it should still be possible to type manually
  private kinds = ['Pod', 'Service', 'Node', 'Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob'];
  private names: Map<string, string[]> = new Map();

  getClusters() {
    return this.clusters;
  }

  setClusters(cs: string[]) {
    this.clusters = cs;
  }

  getUDNs() {
    return this.udns;
  }

  setUDNs(nets: string[]) {
    this.udns = nets;
  }

  getZones() {
    return this.zones;
  }

  setZones(zs: string[]) {
    this.zones = zs;
  }

  getNamespaces() {
    return this.namespaces;
  }

  setNamespaces(ns: string[]) {
    this.namespaces = ns;
  }

  getKinds() {
    return this.kinds;
  }

  getNames(kind: string, namespace: string) {
    return this.names.get(`${kind}.${namespace}`);
  }

  setNames(kind: string, namespace: string, names: string[]) {
    this.names.set(`${kind}.${namespace}`, names);
  }

  hasNames(kind: string, namespace: string) {
    return this.names.has(`${kind}.${namespace}`);
  }

  clear() {
    this.namespaces = undefined;
    this.names.clear();
  }
}

export const autoCompleteCache = new AutoCompleteCache();
