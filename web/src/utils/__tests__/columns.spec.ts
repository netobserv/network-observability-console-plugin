import fs from 'fs';
import { parse } from 'yaml';
import { Record } from '../../api/ipfix';
import { ColumnConfigDef, ColumnsId, getDefaultColumns } from '../columns';
import { FieldConfig } from '../fields';

const getConfig = () => {
  const file = fs.readFileSync('../config/sample-config.yaml', 'utf8');
  const config = parse(file);
  const columnsConfig: ColumnConfigDef[] = config.frontend.columns;
  const fields: FieldConfig[] = config.frontend.fields;
  return { columnsConfig, fields };
};

describe('Columns', () => {
  const flow: Record = {
    fields: {
      SrcAddr: '10.0.0.1',
      SrcPort: 42000,
      DstAddr: '10.0.0.2',
      DstPort: 8080,
      SrcK8S_Name: 'client',
      DstK8S_Name: 'server'
    },
    labels: {
      SrcK8S_Namespace: 'foo',
      DstK8S_Namespace: 'bar',
      SrcK8S_Type: 'Pod',
      DstK8S_Type: 'Service'
    },
    key: 0
  };
  const { columnsConfig, fields } = getConfig();
  const columns = getDefaultColumns(columnsConfig, fields);

  it('should calculate IP+Port value', () => {
    const col = columns.find(c => c.id === ('SrcAddrPort' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(flow);
    expect(value).toEqual('10.0.0.1:42000');
  });

  it('should calculate src+dst IP+Port values', () => {
    const col = columns.find(c => c.id === ('AddrPort' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(flow);
    expect(value).toEqual(['10.0.0.1:42000', '10.0.0.2:8080']);
  });

  it('should calculate k8s name values', () => {
    const col = columns.find(c => c.id === ('SrcK8S_Name' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(flow);
    expect(value).toEqual({ kind: 'Pod', name: 'client', namespace: 'foo', showNamespace: false });
  });

  it('should calculate k8s service name when empty', () => {
    const col = columns.find(c => c.id === ('DstK8S_OwnerName' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(flow);
    expect(value).toEqual(undefined);
  });

  it('should calculate k8s namespace values', () => {
    const col = columns.find(c => c.id === ('SrcK8S_Namespace' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(flow);
    expect(value).toEqual({ kind: 'Namespace', name: 'foo', showNamespace: false });
  });

  it('should calculate k8s object values', () => {
    const col = columns.find(c => c.id === ('SrcK8S_Object' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(flow);
    expect(value).toEqual({ kind: 'Pod', name: 'client', namespace: 'foo', showNamespace: true });
  });

  it('should fallback on IP', () => {
    const withoutName: Record = { ...flow, fields: { ...flow.fields, SrcK8S_Name: undefined } };
    const col = columns.find(c => c.id === ('SrcK8S_Object' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(withoutName);
    expect(value).toEqual('10.0.0.1:42000');
  });

  it('should calculate src+dst K8S types', () => {
    const col = columns.find(c => c.id === ('K8S_Type' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(flow);
    expect(value).toEqual(['Pod', 'Service']);
  });

  it('should calculate src+dst K8S objects', () => {
    const col = columns.find(c => c.id === ('K8S_Object' as ColumnsId));
    expect(col).toBeDefined();
    const value = col?.value(flow);
    expect(value).toEqual([
      { kind: 'Pod', name: 'client', namespace: 'foo', showNamespace: true },
      { kind: 'Service', name: 'server', namespace: 'bar', showNamespace: true }
    ]);
  });
});
