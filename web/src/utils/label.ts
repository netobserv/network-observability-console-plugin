/* validate any k8s partial label
 *  allow upper / lower case alphanumeric
 *  allow '-' and '.' chars
 *  don't force to start / end with alphanumeric since we can filter on partial names
 */
export const k8sLabel = RegExp('^[-A-Za-z0-9_.]*?$');

export const validateLabel = (label: string) => {
  return k8sLabel.test(label);
};
