import { toPng } from 'html-to-image';

export const toPng(image: HTMLElement, { cacheBust: true, backgroundColor: isDarkTheme ? '#0f1214' : '#f0f0f0' })
.then(dataUrl => {
  const link = document.createElement('a');
  link.download = 'topology.png';
  link.href = dataUrl;
  link.click();
})
.catch(err => {
  console.log(err);
});

}