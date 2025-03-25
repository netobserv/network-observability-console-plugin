import {
  ButtonProps,
  Checkbox,
  Dropdown,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  NumberInput,
  Switch
} from '@patternfly/react-core';
import { getSchemaType, WidgetProps } from '@rjsf/utils';
import classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { JSON_SCHEMA_NUMBER_TYPES } from './const';

export const TextWidget: React.FC<WidgetProps> = props => {
  const { disabled = false, id, onBlur, onChange, onFocus, readonly = false, schema = {}, value = '' } = props;
  const schemaType = getSchemaType(schema);
  return JSON_SCHEMA_NUMBER_TYPES.includes(String(schemaType)) ? (
    <NumberWidget {...props} />
  ) : (
    <span
      className={classNames('pf-v5-c-form-control', {
        'pf-m-disabled': disabled,
        'pf-m-readonly': readonly
      })}
    >
      <input
        disabled={disabled}
        id={id}
        key={id}
        onBlur={onBlur && (event => onBlur(id, event.target.value))}
        onChange={({ currentTarget }) => onChange(currentTarget.value)}
        onFocus={onFocus && (event => onFocus(id, event.target.value))}
        readOnly={readonly}
        type="text"
        value={value}
      />
    </span>
  );
};

export const NumberWidget: React.FC<WidgetProps> = ({ value, id, onChange }) => {
  const numberValue = _.toNumber(value);
  return (
    <span className="pf-v5-c-form-control">
      <input
        id={id}
        key={id}
        onChange={({ currentTarget }) => onChange(currentTarget.value !== '' ? _.toNumber(currentTarget.value) : '')}
        type="number"
        value={_.isFinite(numberValue) ? numberValue : ''}
      />
    </span>
  );
};

export const PasswordWidget: React.FC<WidgetProps> = ({ value = '', id, onChange }) => {
  return (
    <span className="pf-v6-c-form-control">
      <input
        key={id}
        id={id}
        type="password"
        onChange={({ currentTarget }) => onChange(currentTarget.value)}
        value={value}
      />
    </span>
  );
};

export const CheckboxWidget: React.FC<WidgetProps> = ({ value = false, id, label, onChange }) => {
  return (
    <Checkbox
      id={id}
      key={id}
      isChecked={value}
      data-checked-state={value}
      label={label}
      onChange={(_event, checked) => onChange(checked)}
    />
  );
};

export const SwitchWidget: React.FC<WidgetProps> = ({ value, id, label, onChange, options }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const { labelOn = t('true') } = options;
  return (
    <Switch
      id={id || label}
      key={id || label}
      isChecked={_.isNil(value) ? false : value}
      onChange={(_event, v) => onChange(v)}
      label={labelOn as string}
    />
  );
};

export const PodCountWidget: React.FC<WidgetProps> = ({ value, id, onChange }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const changeValueBy = React.useCallback(operation => onChange(_.toInteger(value) + operation), [onChange, value]);
  return (
    <div className="co-m-number-spinner">
      <NumberInput
        value={value}
        onMinus={() => changeValueBy(-1)}
        onChange={onChange}
        onPlus={() => changeValueBy(1)}
        inputProps={{
          id
        }}
        autoFocus
        required
        minusBtnAriaLabel={t('Decrement')}
        minusBtnProps={{ 'data-test-id': 'Decrement' } as ButtonProps}
        plusBtnAriaLabel={t('Increment')}
        plusBtnProps={{ 'data-test-id': 'Increment' } as ButtonProps}
      />
    </div>
  );
};

export enum ImagePullPolicy {
  Always = 'Always',
  Never = 'Never',
  IfNotPresent = 'IfNotPresent'
}

export const ImagePullPolicyWidget: React.FC<WidgetProps> = ({ id, value, onChange }) => {
  return (
    <div className={classNames('co-radio-group')}>
      {_.values(ImagePullPolicy).map(policy => (
        <div key={policy}>
          <label>
            <input
              type="radio"
              value={policy}
              onChange={onChange}
              data-test={`${policy}-radio-input`}
              data-checked-state={policy === value}
            />
            {policy}
          </label>
        </div>
      ))}
    </div>
  );
};

export const SelectWidget: React.FC<WidgetProps> = ({ id, label, onChange, options, schema, value }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setIsOpen] = React.useState(false);
  const { enumOptions = [], title } = options;
  return (
    <Dropdown
      id={id}
      isOpen={isOpen}
      onSelect={(e, v) => {
        onChange(v);
        setIsOpen(false);
      }}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} onClick={() => setIsOpen(!isOpen)} isExpanded={isOpen}>
          {value || t('Select {{title}}', { title: title || schema?.title || label })}
        </MenuToggle>
      )}
    >
      {enumOptions.map(option => (
        <DropdownItem key={option.value} value={option.value}>
          {option.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default {
  BaseInput: TextWidget,
  CheckboxWidget,
  SwitchWidget,
  ImagePullPolicyWidget,
  NumberWidget,
  PasswordWidget,
  PodCountWidget,
  SelectWidget,
  TextWidget,
  int32: NumberWidget,
  int64: NumberWidget
};
