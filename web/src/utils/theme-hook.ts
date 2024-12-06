import * as React from 'react';

export function useTheme(): boolean {
  const [isDarkTheme, setDarkTheme] = React.useState<boolean>(
    document.documentElement.classList.contains('pf-v5-theme-dark')
  );
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    mutations.forEach((mutation: MutationRecord) => {
      if (mutation.attributeName === 'class') {
        setDarkTheme((mutation.target as HTMLElement).classList.contains('pf-v5-theme-dark'));
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true });
  return isDarkTheme;
}
