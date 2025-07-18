export type DynamicFormFieldDependency = {
  controlFieldPath: string[];
  controlFieldValue: string;
  controlFieldName: string;
};

export type UiSchemaOptionsWithDependency = {
  dependency?: DynamicFormFieldDependency;
};

export type DynamicFormSchemaError = {
  title: string;
  message: string;
};
