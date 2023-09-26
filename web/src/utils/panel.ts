export const defaultSize = '500px';
export const minSize = '250px';
export const maxSize = '750px';

export const convertRemToPixels = (rem: number) => {
  //get fontSize from document or fallback to 16 for jest
  return rem * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
};
