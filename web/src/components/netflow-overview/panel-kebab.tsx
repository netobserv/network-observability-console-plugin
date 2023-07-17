import {
  Checkbox,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  KebabToggle,
  Text,
  TextVariants,
  Tooltip
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewPanelId } from '../../utils/overview-panels';
import './panel-kebab.css';
import { exportToPng } from '../../utils/export';

export type PanelKebabOptions = {
  showTotal?: boolean;
  showOthers?: boolean;
  showInternal?: boolean;
  showOutOfScope?: boolean;
  compareToDropped?: boolean;
};

export type PanelKebabProps = {
  id: OverviewPanelId;
  options: PanelKebabOptions;
  setOptions: (opts: PanelKebabOptions) => void;
  isDark?: boolean;
};

export const PanelKebab: React.FC<PanelKebabProps> = ({ id, options, setOptions, isDark }) => {
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

  const setCompareToDropped = React.useCallback(
    (checked: boolean) => {
      setOptions({ ...options, compareToDropped: checked });
    },
    [setOptions, options]
  );

  const onOverviewExport = React.useCallback(() => {
    const overview_flex = document.getElementById(id)?.children[0] as HTMLElement | undefined;

    setShowOptions(false);
    exportToPng('overview_panel', overview_flex as HTMLElement, isDark, id);
  }, [id, isDark]);

  const items = [];
  if (options.showTotal !== undefined) {
    items.push(
      <DropdownItem key={`${id}-show-total`}>
        <Tooltip content={<Text component={TextVariants.p}>{t('Show total traffic for the selected filters')}</Text>}>
          <Checkbox
            id={`${id}-show-total`}
            isChecked={options.showTotal}
            onChange={setShowTotal}
            label={t('Show total')}
            aria-label="Show total"
          />
        </Tooltip>
      </DropdownItem>
    );
  }
  if (options.showOthers !== undefined) {
    items.push(
      <DropdownItem key={`${id}-show-others`}>
        <Tooltip
          content={<Text component={TextVariants.p}>{t('Show other traffic grouped in a separate series')}</Text>}
        >
          <Checkbox
            id={`${id}-show-others`}
            isChecked={options.showOthers}
            onChange={setShowOthers}
            label={t('Show others')}
            aria-label="Show others"
          />
        </Tooltip>
      </DropdownItem>
    );
  }
  if (options.showInternal !== undefined) {
    items.push(
      <DropdownItem key={`${id}-show-internal`}>
        <Tooltip
          content={
            <Text component={TextVariants.p}>
              {t(
                // eslint-disable-next-line max-len
                'Show scope-internal traffic, depending on the selected scope (e.g. node-internal traffic, namespace-internal traffic)'
              )}
            </Text>
          }
        >
          <Checkbox
            id={`${id}-show-internal`}
            isChecked={options.showInternal}
            onChange={setShowInternal}
            label={t('Show internal')}
            aria-label="Show internal"
          />
        </Tooltip>
      </DropdownItem>
    );
  }
  if (options.showOutOfScope !== undefined) {
    items.push(
      <DropdownItem key={`${id}-show-out-of-scope`}>
        <Tooltip
          content={
            <Text component={TextVariants.p}>
              {t('Show out of scope traffic (e.g. host-network traffic when scope is different from "Node")')}
            </Text>
          }
        >
          <Checkbox
            id={`${id}-show-out-of-scope`}
            isChecked={options.showOutOfScope}
            onChange={setShowOutOfScope}
            label={t('Show out of scope')}
            aria-label="Show out of scope"
          />
        </Tooltip>
      </DropdownItem>
    );
  }
  if (options.compareToDropped !== undefined) {
    items.push(
      <DropdownItem key={`${id}-compare-to-dropped`}>
        <Tooltip
          content={<Text component={TextVariants.p}>{t('Compare to total dropped instead of total sent.')}</Text>}
        >
          <Checkbox
            id={`${id}-compare-to-dropped`}
            isChecked={options.compareToDropped}
            onChange={setCompareToDropped}
            label={t('Compare to total dropped')}
            aria-label="SCompare to total dropped"
          />
        </Tooltip>
      </DropdownItem>
    );
  }

  items.push(
    <DropdownItem key={`${id}-export`} onClick={onOverviewExport}>
      {t('Export panel')}
    </DropdownItem>
  );

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
