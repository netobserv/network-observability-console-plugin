import { defaultConfig } from '../model/config';
import { getConfig, getIngesterMaxChunkAge } from '../api/routes';
import { getHTTPErrorDetails } from './errors';
import { parseDuration } from './duration';

export let config = defaultConfig;

export const loadConfig = async () => {
  try {
    config = await getConfig();
  } catch (err) {
    console.log(getHTTPErrorDetails(err));
  }
  return config;
};

export const loadMaxChunkAge = async () => {
  try {
    const maxChunkAgeStr = await getIngesterMaxChunkAge();
    return parseDuration(maxChunkAgeStr);
  } catch (err) {
    console.log(getHTTPErrorDetails(err));
  }
  return NaN;
};
