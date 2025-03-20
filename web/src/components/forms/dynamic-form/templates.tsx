import { Alert, Button, Divider, ExpandableSection, FormHelperText } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import {
  ArrayFieldTemplateProps,
  FieldTemplateProps,
  getSchemaType,
  getUiOptions,
  ObjectFieldTemplateProps
} from '@rjsf/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { JSON_SCHEMA_GROUP_TYPES } from './const';
import { FieldSet, FormField } from './fields';
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
  return (
    <FormField id={id} defaultLabel={label} required={required || false} schema={schema} uiSchema={uiSchema || {}}>
      {children}
      {description}
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

export const AdvancedProperties: React.FC<Pick<ObjectFieldTemplateProps, 'properties'>> = ({ properties }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isExpanded, toggleExpandCollapse] = React.useState(false);
  return (
    <ExpandableSection
      isExpanded={isExpanded}
      toggleTextExpanded={t('Advanced configuration')}
      toggleTextCollapsed={t('Advanced configuration')}
      onToggle={() => {
        toggleExpandCollapse(!isExpanded);
      }}
    >
      {_.map(properties, property => property.content)}
    </ExpandableSection>
  );
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

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = ({
  idSchema,
  properties,
  required,
  schema,
  title,
  uiSchema
}) => {
  const { advanced } = getUiOptions(uiSchema ?? {});
  const { normalProperties, advancedProperties } = _.groupBy(properties ?? [], ({ name }) =>
    _.includes(advanced as string[], name) ? 'advancedProperties' : 'normalProperties'
  );
  return properties?.length ? (
    <FieldSet defaultLabel={title} idSchema={idSchema} required={required} schema={schema} uiSchema={uiSchema}>
      <div className="co-dynamic-form__field-group-content">
        {normalProperties?.length > 0 && _.map(normalProperties, p => p.content)}
        {advancedProperties?.length > 0 && <AdvancedProperties properties={advancedProperties} />}
      </div>
    </FieldSet>
  ) : null;
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
  FieldTemplate: FieldTemplate,
  ArrayFieldTemplate: ArrayFieldTemplate,
  ObjectFieldTemplate: ObjectFieldTemplate
};
