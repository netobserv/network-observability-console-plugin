/* validate any k8s partial label
 *  can start / end with quotes
 *  allow upper / lower case alphanumeric
 *  allow '*' / '-' / '_' / '.' chars
 *  don't force to start / end with alphanumeric since we can filter on partial names
 */
export const k8sLabel = RegExp('^["]{0,1}[A-Za-z0-9*-_.]{1,}?["]{0,1}$');

// validate regex and ensure we don't have quotes or only two
export const validateLabel = (label: string) => {
  const quotesCount = (label.match(/"/g) || []).length;
  return (quotesCount == 0 || quotesCount == 2) && k8sLabel.test(label);
};
