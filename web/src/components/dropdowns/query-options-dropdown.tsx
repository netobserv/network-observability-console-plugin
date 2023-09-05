import { Checkbox, Radio, Select, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Match, PacketLoss, RecordType } from '../../model/flow-query';

export const TOP_VALUES = [5, 10, 15];
export const LIMIT_VALUES = [50, 100, 500, 1000];
export interface QueryOptionsDropdownProps {
  recordType: RecordType;
  setRecordType: (recordType: RecordType) => void;
  showDuplicates: boolean;
  setShowDuplicates: (showDuplicates: boolean) => void;
  allowFlow: boolean;
  allowConnection: boolean;
  allowShowDuplicates: boolean;
  allowPktDrops: boolean;
  useTopK: boolean;
  limit: number;
  setLimit: (limit: number) => void;
  match: Match;
  setMatch: (match: Match) => void;
  packetLoss: PacketLoss;
  setPacketLoss: (pl: PacketLoss) => void;
}

type RecordTypeOption = { label: string; value: RecordType };
type MatchOption = { label: string; value: Match };

type PacketLossOption = { label: string; value: PacketLoss };

// Exported for tests
export const QueryOptionsPanel: React.FC<QueryOptionsDropdownProps> = ({
  recordType,
  setRecordType,
  showDuplicates,
  setShowDuplicates,
  allowFlow,
  allowConnection,
  allowShowDuplicates,
  allowPktDrops,
  useTopK,
  limit,
  setLimit,
  match,
  setMatch,
  packetLoss,
  setPacketLoss
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const recordTypeOptions: RecordTypeOption[] = [
    {
      label: t('Conversation'),
      value: 'allConnections'
    },
    {
      label: t('Flow'),
      value: 'flowLog'
    }
  ];

  const matchOptions: MatchOption[] = [
    {
      label: t('Match all'),
      value: 'all'
    },
    {
      label: t('Match any'),
      value: 'any'
    }
  ];

  const packetLossOptions: PacketLossOption[] = [
    {
      label: t('Fully dropped'),
      value: 'dropped'
    },
    {
      label: t('Containing drops'),
      value: 'hasDrops'
    },
    {
      label: t('Without drops'),
      value: 'sent'
    },
    {
      label: t('All'),
      value: 'all'
    }
  ];

  const limitValues = useTopK ? TOP_VALUES : LIMIT_VALUES;

  return (
    <>
      <div className="pf-c-select__menu-group">
        <Tooltip
          content={t(
            // eslint-disable-next-line max-len
            'Log type to query. A conversation is an aggregation of flows between same peers. Only ended conversations will appear in Overview and Topology tabs.'
          )}
        >
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Log type')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        {recordTypeOptions.map(opt => {
          const disabled =
            (!allowFlow && opt.value === 'flowLog') || (!allowConnection && opt.value === 'allConnections');
          return (
            <div key={`recordType-${opt.value}`}>
              <label className="pf-c-select__menu-item">
                <Tooltip
                  trigger={disabled ? 'mouseenter focus' : ''}
                  content={
                    disabled
                      ? opt.value === 'allConnections'
                        ? t(
                            // eslint-disable-next-line max-len
                            'Only available when FlowCollector.processor.logTypes option equals "CONNECTIONS", "ENDED_CONNECTIONS" or "ALL"'
                          )
                        : t(
                            // eslint-disable-next-line max-len
                            'Only available when FlowCollector.processor.logTypes option equals "FLOWS" or "ALL"'
                          )
                      : undefined
                  }
                >
                  <Radio
                    isChecked={opt.value === recordType}
                    isDisabled={disabled}
                    name={`recordType-${opt.value}`}
                    onChange={() => setRecordType(opt.value)}
                    label={opt.label}
                    data-test={`recordType-${opt.value}`}
                    id={`recordType-${opt.value}`}
                    value={opt.value}
                  />
                </Tooltip>
              </label>
            </div>
          );
        })}
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip
          content={t(
            // eslint-disable-next-line max-len
            'A flow might be reported from several interfaces, and from both source and destination nodes, making it appear several times. By default, duplicates are hidden. Showing duplicates is not possible in Overview and Topology tabs to avoid altering metric calculations. Use the Direction filter to switch between ingress, egress and inner-node traffic.'
          )}
        >
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Duplicated flows')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <label className="pf-c-select__menu-item">
          <Checkbox
            isChecked={allowShowDuplicates ? showDuplicates : false}
            isDisabled={!allowShowDuplicates}
            name={'show-duplicates'}
            onChange={() => setShowDuplicates(!showDuplicates)}
            label={t('Show duplicates')}
            data-test={'show-duplicates'}
            id={'show-duplicates'}
          />
        </label>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip
          content={t(
            // eslint-disable-next-line max-len
            'Whether each query result has to match all the filters or just any of them'
          )}
        >
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Match filters')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        {matchOptions.map(opt => (
          <div key={`match-${opt.value}`}>
            <label className="pf-c-select__menu-item">
              <Radio
                isChecked={opt.value === match}
                name={`match-${opt.value}`}
                onChange={() => setMatch(opt.value)}
                label={opt.label}
                data-test={`match-${opt.value}`}
                id={`match-${opt.value}`}
                value={opt.value}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip
          content={
            <div>
              <div>
                {t('Filter flows by their drop status. Only packets dropped by the kernel are monitored here.')}
              </div>
              <div className="netobserv-align-start">- {t('Fully dropped shows the flows that are 100% dropped')}</div>
              <div className="netobserv-align-start">
                - {t('Containing drops shows the flows having at least one packet dropped')}
              </div>
              <div className="netobserv-align-start">- {t('Without drops show the flows having 0% dropped')}</div>
              <div className="netobserv-align-start">- {t('All shows everything')}</div>
            </div>
          }
        >
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Drops filter')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        {packetLossOptions.map(opt => {
          const disabled = !allowPktDrops && opt.value !== 'all';
          return (
            <div key={`packet-loss-${opt.value}`}>
              <label className="pf-c-select__menu-item">
                <Tooltip
                  trigger={disabled ? 'mouseenter focus' : ''}
                  content={
                    disabled
                      ? t(
                          // eslint-disable-next-line max-len
                          'Only available using eBPF with FlowCollector.agent.ebpf.enablePktDrop option equals "true"'
                        )
                      : undefined
                  }
                >
                  <Radio
                    isChecked={opt.value === packetLoss}
                    isDisabled={disabled}
                    name={`packet-loss-${opt.value}`}
                    onChange={() => setPacketLoss(opt.value)}
                    label={opt.label}
                    data-test={`packet-loss-${opt.value}`}
                    id={`packet-loss-${opt.value}`}
                    value={opt.value}
                  />
                </Tooltip>
              </label>
            </div>
          );
        })}
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip
          content={
            (useTopK ? t('Top items for internal backend queries.') : t('Limit for internal backend queries.')) +
            ' ' +
            t(
              // eslint-disable-next-line max-len
              'Depending on the matching and filter settings, several queries can be performed under the cover, each with this parameter set, resulting in more results after aggregation.'
            )
          }
        >
          <div className="pf-c-select__menu-group-title">
            <>
              {useTopK ? t('Top') : t('Limit')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        {limitValues.map(l => (
          <div key={'limit-' + l}>
            <label className="pf-c-select__menu-item">
              <Radio
                data-test={'limit-' + l}
                id={'limit-' + l}
                name={'limit-' + l}
                isChecked={l === limit}
                label={String(l)}
                onChange={() => setLimit(l)}
                value={String(l)}
              />
            </label>
          </div>
        ))}
      </div>
    </>
  );
};

export const QueryOptionsDropdown: React.FC<QueryOptionsDropdownProps> = props => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <div data-test="query-options-dropdown-container">
      <Select
        data-test="query-options-dropdown"
        id="query-options-dropdown"
        placeholderText={<span>{t('Query options')}</span>}
        isOpen={isOpen}
        onToggle={() => setOpen(!isOpen)}
        customContent={<QueryOptionsPanel {...props} />}
      />
    </div>
  );
};

export default QueryOptionsDropdown;
