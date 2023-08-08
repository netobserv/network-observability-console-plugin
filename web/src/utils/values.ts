export type ReadOnlyValue = Readonly<{
  value: number;
  name: string;
  description?: string;
}>;

export type ReadOnlyValues = Readonly<ReadOnlyValue[]>;
