import { Checkbox, Dropdown, DropdownItem, DropdownPosition, KebabToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewPanelId } from '../../utils/overview-panels';
import './panel-kebab.css';

export type PanelKebabOptions = {
  showTotal?: boolean;
  showOthers?: boolean;
  showInternal?: boolean;
  showOutOfScope?: boolean;
};

export type PanelKebabProps = {
  id: OverviewPanelId;
  options: PanelKebabOptions;
  setOptions: (opts: PanelKebabOptions) => void;
};

export const PanelKebab: React.FC<PanelKebabProps> = ({ id, options, setOptions }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [showOptions, setShowOptions] = React.useState(false);

  const setShowTotal = React.useCallback(
    (checked: boolean) => {
      setOptions({ ...options, showTotal: checked });
    },
    [setOptions, options]
  );

  const setShowOthers = React.useCallback(
    (checked: boolean) => {
      setOptions({ ...options, showOthers: checked });
    },
    [setOptions, options]
  );

  const setShowInternal = React.useCallback(
    (checked: boolean) => {
      setOptions({ ...options, showInternal: checked });
    },
    [setOptions, options]
  );

  const setShowOutOfScope = React.useCallback(
    (checked: boolean) => {
      setOptions({ ...options, showOutOfScope: checked });
    },
    [setOptions, options]
  );

  const items = [];
  if (options.showTotal !== undefined) {
    items.push(
      <DropdownItem key={`${id}-show-total`}>
        <Checkbox
          id={`${id}-show-total`}
          isChecked={options.showTotal}
          onChange={setShowTotal}
          label={t('Show total')}
          aria-label="Show total"
        />
      </DropdownItem>
    );
  }
  if (options.showOthers !== undefined) {
    items.push(
      <DropdownItem key={`${id}-show-others`}>
        <Checkbox
          id={`${id}-show-others`}
          isChecked={options.showOthers}
          onChange={setShowOthers}
          label={t('Show others')}
          aria-label="Show others"
        />
      </DropdownItem>
    );
  }
  if (options.showInternal !== undefined) {
    items.push(
      <DropdownItem key={`${id}-show-internal`}>
        <Checkbox
          id={`${id}-show-internal`}
          isChecked={options.showInternal}
          onChange={setShowInternal}
          label={t('Show internal')}
          aria-label="Show internal"
        />
      </DropdownItem>
    );
  }
  if (options.showOutOfScope !== undefined) {
    items.push(
      <DropdownItem key={`${id}-show-out-of-scope`}>
        <Checkbox
          id={`${id}-show-out-of-scope`}
          isChecked={options.showOutOfScope}
          onChange={setShowOutOfScope}
          label={t('Show out of scope')}
          aria-label="Show out of scope"
        />
      </DropdownItem>
    );
  }

  return (
    <Dropdown
      className="panel-kebab"
      toggle={<KebabToggle onToggle={() => setShowOptions(!showOptions)} />}
      dropdownItems={items}
      isPlain={true}
      isOpen={showOptions}
      position={DropdownPosition.right}
    />
  );
};
