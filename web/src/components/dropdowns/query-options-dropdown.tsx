import { Radio, Select, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Match, PacketLoss, RecordType, Reporter } from '../../model/flow-query';

export const TOP_VALUES = [5, 10, 15];
export const LIMIT_VALUES = [50, 100, 500, 1000];
export interface QueryOptionsDropdownProps {
  recordType: RecordType;
  setRecordType: (recordType: RecordType) => void;
  reporter: Reporter;
  setReporter: (reporter: Reporter) => void;
  allowFlow: boolean;
  allowConnection: boolean;
  allowReporterBoth: boolean;
  useTopK: boolean;
  limit: number;
  setLimit: (limit: number) => void;
  match: Match;
  setMatch: (match: Match) => void;
  packetLoss: PacketLoss;
  setPacketLoss: (pl: PacketLoss) => void;
}

type recordTypeOption = { label: string; value: RecordType };

type ReporterOption = { label: string; value: Reporter };

type MatchOption = { label: string; value: Match };

type PacketLossOption = { label: string; value: PacketLoss };

// Exported for tests
export const QueryOptionsPanel: React.FC<QueryOptionsDropdownProps> = ({
  recordType,
  setRecordType,
  reporter,
  setReporter,
  allowFlow,
  allowConnection,
  allowReporterBoth,
  useTopK,
  limit,
  setLimit,
  match,
  setMatch,
  packetLoss,
  setPacketLoss
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const recordTypeOptions: recordTypeOption[] = [
    {
      label: t('Conversation'),
      value: 'allConnections'
    },
    {
      label: t('Flow'),
      value: 'flowLog'
    }
  ];

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
      label: t('Dropped'),
      value: 'dropped'
    },
    {
      label: t('Contains drops'),
      value: 'hasDrops'
    },
    {
      label: t('Sent'),
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
            'Every flow can be reported from the source node and/or the destination node. For in-cluster traffic, usually both source and destination nodes report flows, resulting in duplicated data. Cluster ingress traffic is only reported by destination nodes, and cluster egress by source nodes.'
          )}
        >
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Reporter node')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        {reporterOptions.map(opt => {
          const disabled = !allowReporterBoth && opt.value === 'both';
          return (
            <div key={`reporter-${opt.value}`}>
              <label className="pf-c-select__menu-item">
                <Tooltip
                  trigger={disabled ? 'mouseenter focus' : ''}
                  content={disabled ? t('Only available in Table view.') : undefined}
                >
                  <Radio
                    isChecked={opt.value === reporter}
                    isDisabled={disabled}
                    name={`reporter-${opt.value}`}
                    onChange={() => setReporter(opt.value)}
                    label={opt.label}
                    data-test={`reporter-${opt.value}`}
                    id={`reporter-${opt.value}`}
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
          content={t(
            // eslint-disable-next-line max-len
            'Records to show from dropped, sent or mix of both.'
          )}
        >
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Packet loss')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        {packetLossOptions.map(opt => (
          <div key={`packet-loss-${opt.value}`}>
            <label className="pf-c-select__menu-item">
              <Radio
                isChecked={opt.value === packetLoss}
                name={`packet-loss-${opt.value}`}
                onChange={() => setPacketLoss(opt.value)}
                label={opt.label}
                data-test={`packet-loss-${opt.value}`}
                id={`packet-loss-${opt.value}`}
                value={opt.value}
              />
            </label>
          </div>
        ))}
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
