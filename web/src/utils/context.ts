import {
  ExtensionK8sModel,
  K8sModel,
  ModelFeatureFlag,
  ResolvedExtension
} from '@openshift-console/dynamic-plugin-sdk';
import _ from 'lodash';
import { ScopeConfigDef } from '../model/scope';

export const DEFAULT_HOST = '/api/proxy/plugin/netobserv-plugin/backend';
export class ContextSingleton {
  private static instance: ContextSingleton;
  private isStandalone: boolean;
  private host: string;
  private forcedNamespace?: string;
  private flowCollectorK8SModel?: K8sModel;
  private scopes: ScopeConfigDef[] = [];

  private constructor() {
    this.host = DEFAULT_HOST;
  }

  public static getInstance(): ContextSingleton {
    if (!ContextSingleton.instance) {
      ContextSingleton.instance = new ContextSingleton();
    }

    return ContextSingleton.instance;
  }

  public static setStandalone() {
    const instance = ContextSingleton.getInstance();
    instance.isStandalone = true;
    instance.host = '';
  }

  public static setContext(
    extensions: ResolvedExtension<
      ModelFeatureFlag,
      {
        flag: string;
        model: ExtensionK8sModel;
      }
    >[],
    forcedNamespace?: string
  ) {
    const isStandalone = (!_.isEmpty(extensions) && extensions[0]?.flags?.required?.includes('dummy')) || false;
    const instance = ContextSingleton.getInstance();
    instance.isStandalone = isStandalone;
    if (isStandalone) {
      instance.host = '';
    } else {
      instance.host = DEFAULT_HOST;
    }
    instance.forcedNamespace = forcedNamespace;
  }

  public static setFlowCollectorK8SModel(model?: K8sModel) {
    const instance = ContextSingleton.getInstance();
    instance.flowCollectorK8SModel = model;
  }

  public static isStandalone() {
    return ContextSingleton.getInstance().isStandalone;
  }

  public static getHost() {
    return ContextSingleton.getInstance().host;
  }

  public static getForcedNamespace() {
    return ContextSingleton.getInstance().forcedNamespace;
  }

  public static getFlowCollectorK8SModel() {
    return ContextSingleton.getInstance().flowCollectorK8SModel;
  }

  public static setScopes(scps: ScopeConfigDef[]) {
    ContextSingleton.getInstance().scopes = scps;
  }

  public static getScopes() {
    return ContextSingleton.getInstance().scopes;
  }
}
