import * as React from 'react';
import { ResourceLinkProps } from '@openshift-console/dynamic-plugin-sdk';
import { useK8sModelsWithColors } from '../src/utils/k8s-models-hook';
import { k8sModels } from './k8s-models';

// This dummy file is used to resolve @Console imports from @openshift-console for JEST / Standalone
// You can add any exports needed here
// Check "moduleNameMapper" in package.json for jest
// and "NormalModuleReplacementPlugin" in webpack.standalone.ts 
export class Dummy extends Error {
  constructor() {
    super('Dummy file for exports');
  }
}

export function isModelFeatureFlag(e: never) {
  return null;
}

export function useResolvedExtensions(isModelFeatureFlag: boolean) {
  return [
    [{
      flags: "dummy",
      model: "",
    }],
    undefined, undefined];
}

export function useK8sModels() {
  return [
    k8sModels,
    false
  ]
}

export const ResourceLink: React.FC<ResourceLinkProps> = ({
  className,
  displayName,
  kind,
  name,
  children,
  dataTest,
}) => {
  const k8sModels = useK8sModelsWithColors();
  const value = displayName ? displayName : name;

  return (
    //TODO: add icon here
    <span className={className}>
      <span
        className="co-m-resource-icon"
        style={{ backgroundColor: k8sModels[kind!].color }}
        title={kind}>
        {k8sModels[kind!].abbr}
      </span>
      <span className="co-resource-item__resource-name" data-test-id={value} data-test={dataTest}>
        {value}
      </span>
      {children}
    </span>
  );
};