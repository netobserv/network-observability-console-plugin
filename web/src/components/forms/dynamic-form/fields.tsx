import { AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';
import { FieldProps, UiSchema } from '@rjsf/utils';
import classnames from 'classnames';
import { JSONSchema7 } from 'json-schema';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSchemaDescription, useSchemaLabel } from './utils';

export const Description: React.FC<{ id?: string; description?: string }> = ({ id, description }) => {
  return description ? (
    <span id={id} className="help-block">
      <div className="co-pre-line">{description}</div>
    </span>
  ) : null;
};

export const DescriptionField: React.FC<FieldProps> = ({ id, description }) => (
  <Description id={id} description={description} />
);

export type FormFieldProps = {
  id: string;
  defaultLabel?: string;
  required: boolean;
  schema: JSONSchema7;
  uiSchema: UiSchema;
};

export const FormField: React.FC<FormFieldProps> = ({ children, id, defaultLabel, required, schema, uiSchema }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [showLabel, label] = useSchemaLabel(schema, uiSchema, defaultLabel || t('Value'));
  return (
    <div id={`${id}_field`} className="form-group">
      {showLabel && label && (
        <label className={classnames('form-label', { 'co-required': required })} htmlFor={id}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
};

export type FieldSetProps = Pick<FieldProps, 'idSchema' | 'required' | 'schema' | 'uiSchema'> & {
  defaultLabel?: string;
};

export const FieldSet: React.FC<FieldSetProps> = ({
  children,
  defaultLabel,
  idSchema,
  required = false,
  schema,
  uiSchema
}) => {
  const [expanded, setExpanded] = React.useState(idSchema['$id'] === 'root'); // root is expanded by default
  const [showLabel, label] = useSchemaLabel(schema, uiSchema || {}, defaultLabel);
  const description = useSchemaDescription(schema, uiSchema || {});
  return showLabel && label ? (
    <div id={`${idSchema.$id}_field-group`} className="form-group co-dynamic-form__field-group">
      <AccordionItem>
        <AccordionToggle
          id={`${idSchema.$id}_accordion-toggle`}
          isExpanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <label className={classnames({ 'co-required': required })} htmlFor={`${idSchema.$id}_accordion-content`}>
            {label}
          </label>
        </AccordionToggle>
        {description && <Description id={`${idSchema.$id}_description`} description={description} />}
        <AccordionContent id={`${idSchema.$id}_accordion-content`} isHidden={!expanded}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </div>
  ) : (
    <>{children}</>
  );
};

export default {
  DescriptionField
};
