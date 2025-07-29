import {
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  Flex,
  FlexItem,
  Popover
} from '@patternfly/react-core';
import { FieldProps, UiSchema } from '@rjsf/utils';
import classnames from 'classnames';
import { JSONSchema7 } from 'json-schema';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../utils/theme-hook';
import { useSchemaDescription, useSchemaLabel } from './utils';

export const Description: React.FC<{
  id?: string;
  label?: string;
  description?: string;
  border?: boolean;
  padding?: boolean;
}> = ({ id, label, description, border, padding }) => {
  const isDarkTheme = useTheme();

  if (!description) {
    return null;
  }

  const parts = description.replaceAll('<br>', '').split('\n');
  let content = <>{description}</>;
  if (parts.length > 1) {
    content = (
      <Popover
        hasAutoWidth
        maxWidth="50%"
        position="top"
        headerContent={label}
        bodyContent={<div className={`co-pre-line description`}>{content}</div>}
      >
        <Button className={`co-pre-line description`} variant="plain" style={{ paddingLeft: 0 }}>
          {`${parts[0]}...`}
        </Button>
      </Popover>
    );
  }

  return (
    <span id={id} className="help-block">
      <div
        className={`co-pre-line description ${border ? 'border' : ''} ${padding ? 'padding' : ''} ${
          isDarkTheme ? 'dark' : 'light'
        }`}
      >
        {content}
      </div>
    </span>
  );
};

export type DescriptionFieldProps = Pick<FieldProps, 'id' | 'description' | 'schema' | 'uiSchema'> & {
  defaultLabel?: string;
};

export const DescriptionField: React.FC<DescriptionFieldProps> = ({
  id,
  description,
  defaultLabel,
  schema,
  uiSchema
}) => {
  const [, label] = useSchemaLabel(schema, uiSchema || {}, defaultLabel);
  return <Description id={id} label={label} description={description} />;
};

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
    <div id={`${id}_field`} className="form-group spaced">
      {showLabel && label ? (
        <Flex direction={{ default: 'row' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <label className={classnames('form-label', { 'co-required': required })} htmlFor={id}>
              {label}
            </label>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_4' }}>{children}</FlexItem>
        </Flex>
      ) : (
        children
      )}
    </div>
  );
};

export type FieldSetProps = Pick<FieldProps, 'idSchema' | 'required' | 'schema' | 'uiSchema'> & {
  defaultLabel?: string;
};

export const FieldSet: React.FC<FieldSetProps> = props => {
  const { children, defaultLabel, idSchema, required = false, schema, uiSchema } = props;
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
        {description && (
          <Description
            id={`${idSchema.$id}_description`}
            label={label}
            description={description}
            border={expanded}
            padding={true}
          />
        )}
        <AccordionContent id={`${idSchema.$id}_accordion-content`} isHidden={!expanded}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </div>
  ) : (
    <>{children}</>
  );
};

// no default fields as these are imported from templates
export default {};
