/* validate any k8s partial name
 *  can start / end with quotes
 *  allow upper / lower case alphanumeric
 *  allow '*' / '-' / '_' / '.' chars
 *  don't force to start / end with alphanumeric since we can filter on partial names
 */
export const k8sName = RegExp('^["]{0,1}[A-Za-z0-9*-_.]{1,}?["]{0,1}$');

// validate regex and ensure we don't have quotes or only two
export const validateK8SName = (label: string) => {
  const quotesCount = (label.match(/"/g) || []).length;
  return (quotesCount == 0 || quotesCount == 2) && k8sName.test(label);
};

//TODO: remove kindToAbbr after integration of console ResourceIcon in topology library
const abbrBlacklist = ['ASS'];
export const kindToAbbr = (kind: string) => {
  const abbrKind = (kind.replace(/[^A-Z]/g, '') || kind.toUpperCase()).slice(0, 4);
  return abbrBlacklist.includes(abbrKind) ? abbrKind.slice(0, -1) : abbrKind;
};
