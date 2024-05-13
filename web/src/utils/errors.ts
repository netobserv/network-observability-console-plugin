// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getHTTPErrorDetails = (err: any, checkPromUnsupported = false) => {
  if (err?.response?.data) {
    const header = err.toString === Object.prototype.toString ? '' : `${err}\n`;
    if (typeof err.response.data === 'object') {
      if (checkPromUnsupported && err.response.data.promUnsupported) {
        return 'promUnsupported:' + String(err.response.data.promUnsupported);
      }
      return (
        header +
        Object.keys(err.response.data)
          .map(key => String(err.response.data[key]))
          .join('\n')
      );
    }
    return header + String(err.response.data);
  }
  return String(err);
};

export const isPromUnsupportedError = (err: string) => {
  return err.startsWith('promUnsupported:');
};

export const getPromUnsupportedError = (err: string) => {
  return err.substring('promUnsupported:'.length);
};
