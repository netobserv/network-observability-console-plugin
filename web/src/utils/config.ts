import { Config, defaultConfig } from '../model/config';
import { getConfig } from '../api/routes';
import { getHTTPErrorDetails } from './errors';

export let config = defaultConfig;

export const loadConfig = async () => {
  try {
    config = await getConfig();
  } catch (err) {
    console.log(getHTTPErrorDetails(err));
  }
};

// Only for testing
export const setConfig = (cfg: Config) => {
  config = cfg;
};
