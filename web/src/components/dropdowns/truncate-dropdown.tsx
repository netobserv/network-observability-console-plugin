import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyTruncateLength } from '../../model/topology';

export const TruncateDropdown: React.FC<{
  selected: TopologyTruncateLength;
  setTruncateLength: (v: TopologyTruncateLength) => void;
  id?: string;
}> = ({ selected, setTruncateLength, id }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [truncateDropdownOpen, setTruncateDropdownOpen] = React.useState(false);

  const getTruncateDisplay = (v: TopologyTruncateLength) => {
    switch (v) {
      case TopologyTruncateLength.XL:
        return t('XL');
      case TopologyTruncateLength.L:
        return t('L');
      case TopologyTruncateLength.M:
        return t('M');
      case TopologyTruncateLength.S:
        return t('S');
      case TopologyTruncateLength.XS:
        return t('XS');
      default:
        return t('None');
    }
  };

  return (
    <Dropdown
      id={id}
      position={DropdownPosition.right}
      toggle={
        <DropdownToggle id={`${id}-dropdown`} onToggle={() => setTruncateDropdownOpen(!truncateDropdownOpen)}>
          {getTruncateDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={truncateDropdownOpen}
      dropdownItems={[
        TopologyTruncateLength.OFF,
        TopologyTruncateLength.XS,
        TopologyTruncateLength.S,
        TopologyTruncateLength.M,
        TopologyTruncateLength.L,
        TopologyTruncateLength.XL
      ].map((v: TopologyTruncateLength) => (
        <DropdownItem
          id={String(v)}
          key={v}
          onClick={() => {
            setTruncateDropdownOpen(false);
            setTruncateLength(v);
          }}
        >
          {getTruncateDisplay(v)}
        </DropdownItem>
      ))}
    />
  );
};

export default TruncateDropdown;
