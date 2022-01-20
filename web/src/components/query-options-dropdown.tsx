import { Radio, Select, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { QueryOptions, Reporter } from '../model/query-options';

export interface QueryOptionsDropdownProps {
  options: QueryOptions;
  setOptions: (opts: QueryOptions) => void;
}

type ReporterOption = { label: string; value: Reporter };

// Exported for tests
export const QueryOptionsPanel: React.FC<QueryOptionsDropdownProps> = ({ options, setOptions }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const reporterOptions: ReporterOption[] = [
    {
      label: t('Source'),
      value: 'source'
    },
    {
      label: t('Destination'),
      value: 'destination'
    },
    {
      label: t('Both'),
      value: 'both'
    }
  ];

  return (
    <>
      <div className="pf-c-select__menu-group">
        <Tooltip
          content={t(
            // eslint-disable-next-line max-len
            'Every flow can be reported from the source node and/or the destination node. For in-cluster traffic, usually both source and destination nodes report flows, resulting in duplicated data. Cluster ingress traffic is only reported by destination nodes, and cluster egress by source nodes.'
          )}
        >
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Reporter node')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        {reporterOptions.map(opt => (
          <div key={`reporter-${opt.value}`}>
            <label className="pf-c-select__menu-item">
              <Radio
                isChecked={opt.value === options.reporter}
                name={`reporter-${opt.value}`}
                onChange={() => setOptions({ ...options, reporter: opt.value })}
                label={opt.label}
                id={`reporter-${opt.value}`}
                value={opt.value}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="pf-c-select__menu-group-title">{t('Limit')}</div>
      {[100, 500, 1000].map(l => (
        <div key={'limit-' + l}>
          <label className="pf-c-select__menu-item">
            <Radio
              id={'limit-' + l}
              name={'limit-' + l}
              isChecked={l === options.limit}
              label={String(l)}
              onChange={() => setOptions({ ...options, limit: l })}
              value={String(l)}
            />
          </label>
        </div>
      ))}
    </>
  );
};

export const QueryOptionsDropdown: React.FC<QueryOptionsDropdownProps> = props => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <div data-test-id="query-options-dropdown-container">
      <Select
        id="query-options-dropdown"
        placeholderText={<span>{t('Query Options')}</span>}
        isOpen={isOpen}
        onToggle={() => setOpen(!isOpen)}
        customContent={<QueryOptionsPanel {...props} />}
      />
    </div>
  );
};

export default QueryOptionsDropdown;
