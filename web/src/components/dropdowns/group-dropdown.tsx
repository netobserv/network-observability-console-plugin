import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyGroupTypes } from '../../model/topology';

export const GroupDropdown: React.FC<{
  selected: TopologyGroupTypes;
  setGroupType: (v: TopologyGroupTypes) => void;
  id?: string;
}> = ({ selected, setGroupType, id }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [groupDropdownOpen, setGroupDropdownOpen] = React.useState(false);

  const getGroupDisplay = (groupType: TopologyGroupTypes) => {
    switch (groupType) {
      case TopologyGroupTypes.ALL:
        return t('All');
      case TopologyGroupTypes.NAMESPACES:
        return t('Namespaces');
      case TopologyGroupTypes.OWNERS:
        return t('Owners');
      default:
        return t('None');
    }
  };

  return (
    <Dropdown
      id={id}
      position={DropdownPosition.right}
      toggle={
        <DropdownToggle id={`${id}-dropdown`} onToggle={() => setGroupDropdownOpen(!groupDropdownOpen)}>
          {getGroupDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={groupDropdownOpen}
      dropdownItems={Object.values(TopologyGroupTypes).map(v => (
        <DropdownItem
          id={v}
          key={v}
          onClick={() => {
            setGroupDropdownOpen(false);
            setGroupType(v);
          }}
        >
          {getGroupDisplay(v)}
        </DropdownItem>
      ))}
    />
  );
};

export default GroupDropdown;
