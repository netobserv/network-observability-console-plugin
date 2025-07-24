import { Alert, Button, Divider, FormHelperText } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import {
  ArrayFieldTemplateProps,
  DescriptionFieldProps,
  FieldTemplateProps,
  getSchemaType,
  getUiOptions,
  ObjectFieldTemplateProps
} from '@rjsf/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { JSON_SCHEMA_GROUP_TYPES } from './const';
import { DescriptionField, FieldSet, FormField } from './fields';
import { UiSchemaOptionsWithDependency } from './types';
import { useSchemaLabel } from './utils';

export const AtomicFieldTemplate: React.FC<FieldTemplateProps> = ({
  children,
  id,
  label,
  rawErrors,
  description,
  required,
  schema,
  uiSchema
}) => {
  // put description before or after children based on widget type
  const descriptionFirst = uiSchema?.['ui:descriptionFirst'] === 'true';
  return (
    <FormField id={id} defaultLabel={label} required={required || false} schema={schema} uiSchema={uiSchema || {}}>
      {descriptionFirst && description}
      {children}
      {!descriptionFirst && description}
      {!_.isEmpty(rawErrors) && (
        <>
          {_.map(rawErrors, error => (
            <FormHelperText key={error}>{_.capitalize(error)}</FormHelperText>
          ))}
        </>
      )}
    </FormField>
  );
};

export const DescriptionFieldTemplate: React.FC<DescriptionFieldProps> = props => {
  return <DescriptionField {...props} />;
};

export const FieldTemplate: React.FC<FieldTemplateProps> = props => {
  const { id, hidden, schema = {}, children, uiSchema = {}, formContext = {} } = props;
  const type = getSchemaType(schema);
  const [dependencyMet, setDependencyMet] = React.useState(true);
  React.useEffect(() => {
    const { dependency } = getUiOptions(uiSchema ?? {}) as UiSchemaOptionsWithDependency; // Type defs for this function are awful
    if (dependency) {
      setDependencyMet(() => {
        let val = _.get(formContext.formData ?? {}, ['spec'], '');
        dependency.controlFieldPath.forEach(path => {
          val = _.get(val, [path], '');
          if (Array.isArray(val)) {
            // retreive id from path
            // example root_spec_exporters_4_ipfix will return 4
            val = val[Number(id.replace(/\D/g, ''))];
          }
        });

        return dependency?.controlFieldValue === String(val);
      });
    }
  }, [uiSchema, formContext, id]);

  if (hidden || !dependencyMet) {
    return null;
  }
  const isGroup = JSON_SCHEMA_GROUP_TYPES.includes(String(type));
  return isGroup ? children : <AtomicFieldTemplate {...props} />;
};

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = props => {
  const { idSchema, properties, required, schema, title, uiSchema } = props;
  const { flat } = getUiOptions(uiSchema ?? {});
  if (flat === 'true') {
    return <>{_.map(properties || [], p => p.content)}</>;
  }

  return (
    <FieldSet defaultLabel={title} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
      <div className="co-dynamic-form__field-group-content">
        {properties?.length > 0 && _.map(properties, p => p.content)}
      </div>
    </FieldSet>
  );
};

export const ArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = ({
  idSchema,
  items,
  onAddClick,
  required,
  schema,
  title,
  uiSchema
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [, label] = useSchemaLabel(schema, uiSchema || {}, title ?? 'Items');
  return (
    <FieldSet defaultLabel={label} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
      {_.map(items ?? [], item => {
        return (
          <div className="co-dynamic-form__array-field-group-item" key={item.key}>
            {item.index > 0 && <Divider className="co-divider" />}
            {item.hasRemove && (
              <div className="row co-dynamic-form__array-field-group-remove">
                <Button
                  icon={<MinusCircleIcon className="co-icon-space-r" />}
                  id={`${item.key}_remove-btn`}
                  type="button"
                  onClick={item.onDropIndexClick(item.index)}
                  variant="link"
                >
                  {t('Remove {{singularLabel}}', { singularLabel: label })}
                </Button>
              </div>
            )}
            {item.children}
          </div>
        );
      })}
      <div className="row">
        <Button
          icon={<PlusCircleIcon className="co-icon-space-r" />}
          id={`${idSchema.$id}_add-btn`}
          type="button"
          onClick={onAddClick}
          variant="link"
        >
          {t('Add {{singularLabel}}', { singularLabel: label })}
        </Button>
      </div>
    </FieldSet>
  );
};

export const ErrorTemplate: React.FC<{ errors: string[] }> = ({ errors }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  return (
    <Alert isInline className="co-alert co-break-word co-alert--scrollable" variant="danger" title={t('Error')}>
      {t('Fix the following errors:')}
      <ul>
        {_.map(errors, error => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </Alert>
  );
};

export default {
  FieldTemplate,
  DescriptionFieldTemplate,
  ArrayFieldTemplate,
  ObjectFieldTemplate
};
