import { getService } from 'port-numbers';

export const formatPort = p => {
  const service = getService(p);
  if (service) {
    // return util.format("%s (%d)", service.name, p)
    return `${service.name} (${p})`;
  } else {
    return String(p);
  }
};
