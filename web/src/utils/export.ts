import { toPng } from 'html-to-image';

export const exportToPng = (
  name: string,
  element: HTMLElement | undefined,
  isDark?: boolean,
  id?: string,
  callback?: () => void
) => {
  if (element) {
    toPng(element, { cacheBust: true, backgroundColor: isDark ? '#0f1214' : '#f0f0f0' })
      .then(dataUrl => {
        const link = document.createElement('a');
        if (id) {
          link.download = `${name}_${id}.png`;
        } else {
          link.download = `${name}.png`;
        }
        link.href = dataUrl;
        link.click();
        if (callback) {
          callback();
        }
      })
      .catch(err => {
        console.error(err);
      });
  } else {
    console.error('exportToPng called but element is undefined');
  }
};
