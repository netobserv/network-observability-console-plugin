import { ExtensionK8sModel, ModelFeatureFlag, ResolvedExtension } from '@openshift-console/dynamic-plugin-sdk';
import _ from 'lodash';

export const DEFAULT_HOST = '/api/proxy/plugin/netobserv-plugin/backend/';
export class ContextSingleton {
  private static instance: ContextSingleton;
  private isStandalone: boolean;
  private host: string;

  private constructor() {
    this.host = DEFAULT_HOST;
  }

  public static getInstance(): ContextSingleton {
    if (!ContextSingleton.instance) {
      ContextSingleton.instance = new ContextSingleton();
    }

    return ContextSingleton.instance;
  }

  public static setContext(
    extensions: ResolvedExtension<
      ModelFeatureFlag,
      {
        flag: string;
        model: ExtensionK8sModel;
      }
    >[]
  ) {
    const isStandalone = !_.isEmpty(extensions) && extensions[0]?.flags === 'dummy';
    const instance = ContextSingleton.getInstance();
    instance.isStandalone = isStandalone;
    if (isStandalone) {
      instance.host = '';
    } else {
      instance.host = DEFAULT_HOST;
    }
  }

  public static isStandalone() {
    return ContextSingleton.getInstance().isStandalone;
  }

  public static getHost() {
    return ContextSingleton.getInstance().host;
  }
}
