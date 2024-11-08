import { getRecordValue, Record } from '../api/ipfix';
import { Column, ColumnConfigDef, ColumnsId, ColValue } from './columns';
import { FieldConfig, FieldType } from './fields';

const getColumnOrRecordValue = (
  columns: Column[],
  record: Record,
  arg: string,
  defaultValue: string | number
): ColValue => {
  if (arg.startsWith(`'`) && arg.endsWith(`'`)) {
    // literal
    return arg.substring(1, arg.length - 1);
  } else if (arg.startsWith('column.')) {
    const colId = arg.replace('column.', '');
    const found = columns.find(c => c.id === colId);
    if (found && found.value) {
      return found.value(record);
    }
    return defaultValue;
  }
  return getRecordValue(record, arg, defaultValue);
};

const funcs: { [name: string]: (columns: Column[], record: Record, args: string[]) => ColValue } = {
  concat: (columns: Column[], record: Record, args: string[]): ColValue => {
    if (args.length < 2) {
      console.error('getDefaultColumns - invalid parameters for concat calculated value', args);
      return '';
    }
    return args.map(a => getColumnOrRecordValue(columns, record, a, '')).join('');
  },
  kubeObject: (columns: Column[], record: Record, args: string[]): ColValue => {
    if (args.length !== 4) {
      console.error('getDefaultColumns - invalid parameters for kubeObject calculated value', args);
      return '';
    }
    const kind = String(getColumnOrRecordValue(columns, record, args[0], ''));
    const namespace = String(getColumnOrRecordValue(columns, record, args[1], ''));
    const name = String(getColumnOrRecordValue(columns, record, args[2], ''));
    if (!name || !kind) {
      return undefined;
    }
    return {
      kind: kind,
      name: name,
      namespace: namespace || undefined, // convert empty string to undefined
      showNamespace: args[3] === '1'
    };
  },
  substract: (columns: Column[], record: Record, args: string[]): ColValue => {
    if (args.length !== 2) {
      console.error('getDefaultColumns - invalid parameters for substract calculated value', args);
      return '';
    }
    return (
      (getColumnOrRecordValue(columns, record, args[0], 0) as number) -
      (getColumnOrRecordValue(columns, record, args[1], 0) as number)
    );
  },
  multiply: (columns: Column[], record: Record, args: string[]): ColValue => {
    if (args.length !== 2) {
      console.error('getDefaultColumns - invalid parameters for multiply calculated value', args);
      return '';
    }
    return (getColumnOrRecordValue(columns, record, args[0], 0) as number) * Number(args[1]);
  }
};

const parseORs = (columns: Column[], calculatedValue: string): ((record: Record) => ColValue)[] => {
  // parseORs returns a closure [(Record) => ColValue] to pre-process as much as possible
  const ors = calculatedValue.split(' or ');
  return ors.map(or => {
    for (const name in funcs) {
      if (or.startsWith(name + '(')) {
        const regex = new RegExp(name + '|\\(|\\)', 'g');
        const repl = or.replaceAll(regex, '');
        const args = repl.split(',');
        return (record: Record) => funcs[name](columns, record, args);
      }
    }
    return () => undefined;
  });
};

const forceType = (id: ColumnsId, value: ColValue, type?: FieldType): ColValue => {
  if (!type) {
    console.error('Column ' + id + " doesn't specify type");
  }
  // check if value type match and convert it if needed
  if (value && value !== '' && typeof value !== type && !Array.isArray(value)) {
    switch (type) {
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      default:
        throw new Error('forceType error: type ' + type + ' is not managed');
    }
  } else {
    // else return value directly
    return value;
  }
};

export type ValueFunc = (record: Record) => ColValue;
export const computeValueFunc = (
  def: ColumnConfigDef,
  columns: Column[],
  fields: FieldConfig[] | undefined,
  field: FieldConfig | undefined
): ValueFunc | undefined => {
  if (def.calculated) {
    if (def.calculated.startsWith('[') && def.calculated.endsWith(']')) {
      const values = def.calculated.replaceAll(/\[|\]/g, '').split(',');
      return (r: Record) => {
        const result = values.map(v => getColumnOrRecordValue(columns, r, v, ''));
        return result.flatMap(r => r) as ColValue;
      };
    }
    const orFuncs = parseORs(columns, def.calculated!);
    return (r: Record) => {
      for (const orFunc of orFuncs) {
        const result = orFunc(r);
        if (result) {
          return result;
        }
      }
      return undefined;
    };
  } else if (fields) {
    return (r: Record) => {
      const result: ColValue[] = fields.map(fc => {
        const value = getRecordValue(r, fc.name, undefined);
        return forceType(def.id as ColumnsId, value, fc.type);
      });
      return result.flatMap(r => r) as ColValue;
    };
  } else if (field) {
    return (r: Record) => {
      const value = getRecordValue(r, field!.name, '');
      return forceType(def.id as ColumnsId, value, field!.type);
    };
  }
  console.warn('column.value called on ' + def.id + ' but not configured');
  return undefined;
};
