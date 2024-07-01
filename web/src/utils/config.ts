import { getConfig } from '../api/routes';
import { defaultConfig } from '../model/config';
import { getHTTPErrorDetails } from './errors';

export let config = defaultConfig;

export const loadConfig = async () => {
  let error = null;
  try {
    config = await getConfig();
  } catch (err) {
    error = getHTTPErrorDetails(err);
    console.log(error);
  }
  return { config, error };
};
