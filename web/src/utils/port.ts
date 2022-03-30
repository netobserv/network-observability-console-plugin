import * as portnumbers from 'port-numbers';
import { Config } from '../model/config';

export const getService = (p: number, config: Config): string | null => {
  if (config != undefined && config.portNaming != undefined) {
    //default ports enabled by default

    if (config.portNaming.Enable != undefined && !config.portNaming.Enable) {
      return null;
    }
    if (!!config.portNaming.portNames) {
      //cannot use .has() in if test and then return get() because then
      //linter complains we may returns undefined
      const customPort = config.portNaming.portNames.get(p.toString());
      if (customPort != undefined) {
        return customPort;
      }
    }
  }
  if (p < 1024) {
    const service = portnumbers.getService(p);
    if (!!service) {
      return service.name;
    } else {
      return null;
    }
  } else {
    return null;
  }
};

export const getPort = (p: string, config: Config): string | null => {
  if (config != undefined && config.portNaming != undefined) {
    //default ports enabled by default
    if (config.portNaming.Enable != undefined && !config.portNaming.Enable) {
      return null;
    }
    if (!!config.portNaming.portNames) {
      const customPort = [...config.portNaming.portNames].find(([{}, v]) => v === p);
      if (!!customPort) {
        return customPort[0];
      }
    }
  }
  const port = portnumbers.getPort(p);
  if (port && port.port < 1024) {
    return port.port.toString();
  }
  return null;
};

export const formatPort = (p: number, config: Config) => {
  const service = getService(p, config);
  if (service) {
    return `${service} (${p})`;
  } else {
    return String(p);
  }
};

// This sort is ordering first the port with a known service
// then order numerically the other port
export const comparePorts = (p1: number, p2: number, config: Config) => {
  const s1 = getService(p1, config);
  const s2 = getService(p2, config);
  if (s1 && s2) {
    return formatPort(p1, config).localeCompare(formatPort(p2, config));
  }
  if (s1) {
    return -1;
  }
  if (s2) {
    return 1;
  }
  return p1 - p2;
};
