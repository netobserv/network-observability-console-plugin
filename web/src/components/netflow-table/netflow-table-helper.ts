export type Size = 's' | 'm' | 'l';
export const remToPxl = (rem: number) =>
  Math.floor(rem * parseFloat(getComputedStyle(document.documentElement).fontSize));
export const sizeToPxl = (size: Size) => {
  switch (size) {
    case 'l':
      return remToPxl(4.8);
    case 'm':
      return remToPxl(3.4);
    case 's':
    default:
      return remToPxl(2);
  }
};
