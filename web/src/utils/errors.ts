// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getHTTPErrorDetails = (err: any, checkPromErrors = false) => {
  if (err?.response?.data) {
    const header = err.toString === Object.prototype.toString ? '' : `${err}\n`;
    if (typeof err.response.data === 'object') {
      if (checkPromErrors) {
        if (err.response.data.promUnsupported) {
          return 'promUnsupported:' + String(err.response.data.promUnsupported);
        } else if (err.response.data.promDisabledMetrics) {
          return 'promDisabledMetrics:' + String(err.response.data.promDisabledMetrics);
        } else if (err.response.data.promMissingLabels) {
          return 'promMissingLabels:' + String(err.response.data.promMissingLabels);
        }
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
  return err.includes('promUnsupported:');
};

export const isPromDisabledMetricsError = (err: string) => {
  return err.includes('promDisabledMetrics:');
};

export const isPromMissingLabelError = (err: string) => {
  return err.includes('promMissingLabels:');
};

export const isPromError = (err: string) => {
  return isPromUnsupportedError(err) || isPromDisabledMetricsError(err) || isPromMissingLabelError(err);
};

export const getPromError = (err: string) => {
  if (isPromUnsupportedError(err)) {
    return err.substring('promUnsupported:'.length);
  } else if (isPromDisabledMetricsError(err)) {
    return err.substring('promDisabledMetrics:'.length);
  } else if (isPromMissingLabelError(err)) {
    return err.substring('promMissingLabels:'.length);
  } else {
    return err;
  }
};
