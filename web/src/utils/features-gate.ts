//List in progress features here
export enum Feature {
  Overview = 'overview',
  ThreeD = '3d'
}

/*Use isAllowed function to display in progress features
 * on localhost or with it's corresponding url parameter
 * example: http://myclusterhost:9000/netflow-traffic?topology=preview
 */
export const isAllowed = (f: Feature) => {
  const url = window.location.toString();
  return url.includes(`${f}=preview`);
};
