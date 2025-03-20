/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceKindReference,
  ResourceIconProps,
  ResourceLinkProps,
  ResourceYAMLEditorProps
} from '@openshift-console/dynamic-plugin-sdk';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import * as React from 'react';
import { useK8sModelsWithColors } from '../src/utils/k8s-models-hook';
import { useTheme } from '../src/utils/theme-hook';
import { safeJSToYAML } from '../src/utils/yaml';
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
      flags: {
        required: ["dummy"],
      },
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

export function getK8sModel(k8s: any, k8sGroupVersionKind?: K8sResourceKindReference | K8sGroupVersionKind): K8sModel {
  const models = Object.keys(k8sModels);

  for (let i = 0; i < models.length; i++) {
    const model = (k8sModels as any)[models[i]];
    if (model.kind === k8s.kind) {
      return model;
    }
  }

  return {
    abbr: '',
    kind: '',
    label: '',
    labelPlural: '',
    plural: '',
    apiVersion: ''
  };
}

export function k8sGet(k8s: any): Promise<any> {
  return Promise.resolve(k8s);
}

export function k8sCreate(k8s: any): Promise<any> {
  return Promise.resolve(k8s);
}

export function k8sUpdate(k8s: any): Promise<any> {
  return Promise.resolve(k8s);
}

export function useK8sWatchResource(req: any) {
  return [null, true, null];
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({
  className,
  kind,
  children,
}) => {
  const k8sModels = useK8sModelsWithColors();

  return (
    <span className={className}>
      {k8sModels[kind!] && <span
        className="co-m-resource-icon"
        style={{ backgroundColor: k8sModels[kind!].color }}
        title={kind}>
        {k8sModels[kind!].abbr}
      </span>}
      {children}
    </span>
  );
};

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
    <span className={className}>
      {k8sModels[kind!] && <span
        className="co-m-resource-icon"
        style={{ backgroundColor: k8sModels[kind!].color }}
        title={kind}>
        {k8sModels[kind!].abbr}
      </span>}
      <span className="co-resource-item__resource-name" data-test-id={value} data-test={dataTest}>
        {value}
      </span>
      {children}
    </span>
  );
};

export const ResourceYAMLEditor: React.FC<ResourceYAMLEditorProps> = ({
  initialResource,
  header,
  onSave,
}) => {
  const isDarkTheme = useTheme();
  const containerHeight = document.getElementById("editor-content-container")?.clientHeight || 400;
  const footerHeight = document.getElementById("editor-toggle-footer")?.clientHeight || 0;
  return (<>
    <CodeEditor
      isDarkTheme={isDarkTheme}
      isLineNumbersVisible={true}
      isReadOnly={false}
      isMinimapVisible={true}
      isLanguageLabelVisible
      code={safeJSToYAML(initialResource)}
      language={Language.yaml}
      height={`${containerHeight - footerHeight}px`}
      onChange={(value) => onSave && onSave(value)}
    />
  </>);
};
