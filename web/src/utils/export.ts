import { toPng } from 'html-to-image';

export function exportfunc(name: string, image: HTMLElement, isDark?: boolean, id?: string) {
  toPng(image, { cacheBust: true, backgroundColor: isDark ? '#0f1214' : '#f0f0f0' })
    .then(dataUrl => {
      const link = document.createElement('a');
      if (id) {
        link.download = `${name}_${id}.png`;
      } else {
        link.download = `${name}.png`;
      }
      link.href = dataUrl;
      link.click();
    })
    .catch(err => {
      console.error(err);
    });
};
