/* This file contains id generation reused by QE team
 *  Please keep them updated of any change
 */

/**
 * getTopologyGroupId gets a unique group id
 * @param groupType string that represent group type.
 * This could either be 'Node', 'Namespace' or any valid K8S Owner / Resource type
 * @param name string that represent group name
 * This could either be Host, Namespace or Owner name
 * @returns string that identify the group
 */
export const getTopologyGroupId = (groupType: string, name: string) => {
  return `${groupType}.${name}`.toLowerCase();
};

/**
 * getTopologyEdgeId gets a unique edge id between two nodes
 * source / target can be inverted. If one of these pairs already exists, the opposit will not be created
 * @param sourceId string that represent a NodeId
 * @param targetId string that represent another NodeId
 * @returns string that identify the edge
 */
export const getTopologyEdgeId = (sourceId: string, targetId: string) => {
  return `${sourceId}.${targetId}`.toLowerCase();
};

/**
 * getTopologyNodeId gets a unique node id
 * @param nodeType string that represent node type
 * This could either be 'Node', 'Namespace' or any valid K8S Ower / Resource type
 * @param namespace string that represent namespace (may be empty for external / host)
 * @param name string that represent name (may be empty for external)
 * @param addr string containing ip address (may be empty for external when scope is not ressources)
 * @param host string containing host (may be empty for services / external)
 * @returns string that identify the node
 */
export const getTopologyNodeId = (
  nodeType?: string,
  namespace?: string,
  name?: string,
  addr?: string,
  host?: string
) => {
  const strs: string[] = [];

  function addStr(str?: string) {
    if (str) {
      strs.push(str);
    }
  }

  addStr(nodeType);
  addStr(namespace);
  addStr(name);
  addStr(addr);
  addStr(host);

  if (strs.length) {
    return strs.join('.').toLowerCase();
  }
  return 'external';
};
