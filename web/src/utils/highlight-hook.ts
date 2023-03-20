type Offset = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export const useHighLight = (isDark: boolean) => {
  const getOffsetAndSize = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect(),
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      right: window.innerWidth - rect.right - el.scrollWidth + scrollLeft,
      bottom: window.innerHeight - rect.top - el.scrollHeight + scrollTop,
      width: el.scrollWidth + 5, //margin for small buttons
      height: el.scrollHeight
    };
  };

  const getOverlay = (pageOffset: Offset, offset: Offset, position: 'top' | 'right' | 'bottom' | 'left') => {
    const overlay = document.getElementById(`netobserv-overlay-${position}`) || document.createElement('div');
    overlay.id = `netobserv-overlay-${position}`;
    overlay.classList.add('netobserv-overlay');
    overlay.classList.add(position);
    if (isDark) {
      overlay.classList.add('dark');
    } else if (overlay.classList.contains('dark')) {
      overlay.classList.remove('dark');
    }

    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.left = '0';

    switch (position) {
      case 'top':
        overlay.style.bottom = `${offset.bottom + offset.height}px`;
        break;
      case 'right':
        overlay.style.top = `${offset.top}px`;
        overlay.style.bottom = `${offset.bottom}px`;
        overlay.style.left = `${offset.left + offset.width}px`;
        break;
      case 'bottom':
        overlay.style.top = `${offset.top + offset.height}px`;
        break;
      case 'left':
        overlay.style.top = `${offset.top}px`;
        overlay.style.bottom = `${offset.bottom}px`;
        overlay.style.right = `${pageOffset.left + pageOffset.width - offset.left}px`;
        break;
    }
    return overlay;
  };

  const highlightElement = (elem: HTMLElement) => {
    const page = document.getElementById('pageSection');
    if (!page) {
      return;
    }

    const overlayContainer = document.getElementById('netobserv-overlay-container') || document.createElement('div');
    overlayContainer.id = 'netobserv-overlay-container';

    const pageOffset = getOffsetAndSize(page);
    const elementOffset = getOffsetAndSize(elem);
    overlayContainer.append(
      getOverlay(pageOffset, elementOffset, 'top'),
      getOverlay(pageOffset, elementOffset, 'right'),
      getOverlay(pageOffset, elementOffset, 'bottom'),
      getOverlay(pageOffset, elementOffset, 'left')
    );
    page.append(overlayContainer);
  };

  const clearHighlights = () => {
    document.getElementById('netobserv-overlay-container')?.remove();
  };

  return {
    highlightElement,
    clearHighlights
  };
};
