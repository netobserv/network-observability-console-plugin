import { Checkbox, Content, ContentVariants, Radio, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataSource, Match, PacketLoss, RecordType } from '../../model/flow-query';
import { QueryOptionsProps } from './query-options-dropdown';

export const topValues = [5, 10, 15];
export const limitValues = [50, 100, 500, 1000];

type RecordTypeOption = { label: string; value: RecordType };
type DataSourceOption = { label: string; value: DataSource };
type MatchOption = { label: string; value: Match };

type PacketLossOption = { label: string; value: PacketLoss };

// Exported for tests
export const QueryOptionsPanel: React.FC<QueryOptionsProps> = ({
  recordType,
  setRecordType,
  dataSource,
  setDataSource,
  showDuplicates,
  setShowDuplicates,
  allowLoki,
  allowProm,
  allowFlow,
  allowConnection,
  allowShowDuplicates,
  deduperMark,
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

  const dataSourceOptions: DataSourceOption[] = [
    {
      label: t('Loki'),
      value: 'loki'
    },
    {
      label: t('Prometheus'),
      value: 'prom'
    },
    {
      label: t('Auto'),
      value: 'auto'
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

  const values = useTopK ? topValues : limitValues;

  return (
    <>
      <div className="pf-v6-c-menu__group">
        <Tooltip
          content={t(
            'Log type to query. A conversation is an aggregation of flows between same peers. Only ended conversations will appear in Overview and Topology tabs.'
          )}
        >
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Log type')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        {recordTypeOptions.map(opt => {
          const disabled =
            (!allowFlow && opt.value === 'flowLog') || (!allowConnection && opt.value === 'allConnections');
          return (
            <div key={`recordType-${opt.value}`}>
              <label className="display-dropdown-padding pf-v6-c-menu__menu-item">
                <Tooltip
                  trigger={disabled ? 'mouseenter focus' : ''}
                  content={
                    disabled
                      ? opt.value === 'allConnections'
                        ? t(
                            'Only available when FlowCollector.processor.logTypes option equals "CONNECTIONS", "ENDED_CONNECTIONS" or "ALL"'
                          )
                        : t('Only available when FlowCollector.processor.logTypes option equals "FLOWS" or "ALL"')
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
      <div className="pf-v6-c-menu__group">
        <Tooltip
          content={t(
            // eslint-disable-next-line max-len
            'Which datasource to query from console plugin pod. Prometheus holds a subset of metrics compared to Loki with better performances. Select "Auto" to pick the best datasource automatically.'
          )}
        >
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Datasource')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        {dataSourceOptions.map(opt => {
          const disabled = (!allowProm && opt.value === 'prom') || (!allowLoki && opt.value === 'loki');
          return (
            <div key={`dataSource-${opt.value}`}>
              <label className="display-dropdown-padding pf-v6-c-menu__menu-item">
                <Tooltip
                  trigger={disabled ? 'mouseenter focus' : ''}
                  content={
                    disabled
                      ? opt.value === 'prom'
                        ? t(
                            'Only available when FlowCollector.prometheus.enable is true for Overview and Topology tabs'
                          )
                        : opt.value === 'loki'
                        ? t('Only available when FlowCollector.loki.enable is true')
                        : undefined
                      : undefined
                  }
                >
                  <Radio
                    isChecked={opt.value === dataSource}
                    isDisabled={disabled}
                    name={`dataSource-${opt.value}`}
                    onChange={() => setDataSource(opt.value)}
                    label={opt.label}
                    data-test={`dataSource-${opt.value}`}
                    id={`dataSource-${opt.value}`}
                    value={opt.value}
                  />
                </Tooltip>
              </label>
            </div>
          );
        })}
      </div>
      {deduperMark && (
        <div className="pf-v6-c-menu__group">
          <Tooltip
            content={t(
              // eslint-disable-next-line max-len
              'A flow might be reported from several interfaces, and from both source and destination nodes, making it appear several times. By default, duplicates are hidden. Showing duplicates is not possible in Overview and Topology tabs to avoid altering metric calculations. Use the Direction filter to switch between ingress, egress and inner-node traffic.'
            )}
          >
            <div className="pf-v6-c-menu__group-title">
              <Content component={ContentVariants.p}>
                {t('Duplicated flows')} <InfoAltIcon />
              </Content>
            </div>
          </Tooltip>
          <label className="display-dropdown-padding pf-v6-c-menu__menu-item">
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
      )}
      <div className="pf-v6-c-menu__group">
        <Tooltip content={t('Whether each query result has to match all the filters or just any of them')}>
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Match filters')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        {matchOptions.map(opt => (
          <div key={`match-${opt.value}`}>
            <label className="display-dropdown-padding pf-v6-c-menu__menu-item">
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
      <div className="pf-v6-c-menu__group">
        <Tooltip
          content={
            <div className="netobserv-tooltip-text">
              <Content component={ContentVariants.p}>
                {t('Filter flows by their drop status. Only packets dropped by the kernel are monitored here.')}
              </Content>
              <Content component={ContentVariants.p} className="netobserv-align-start">
                - {t('Fully dropped shows the flows that are 100% dropped')}
              </Content>
              <Content component={ContentVariants.p} className="netobserv-align-start">
                - {t('Containing drops shows the flows having at least one packet dropped')}
              </Content>
              <Content component={ContentVariants.p} className="netobserv-align-start">
                - {t('Without drops show the flows having 0% dropped')}
              </Content>
              <Content component={ContentVariants.p} className="netobserv-align-start">
                - {t('All shows everything')}
              </Content>
            </div>
          }
        >
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Drops filter')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        {packetLossOptions.map(opt => {
          const disabled = !allowPktDrops && opt.value !== 'all';
          return (
            <div key={`packet-loss-${opt.value}`}>
              <label className="display-dropdown-padding pf-v6-c-menu__menu-item">
                <Tooltip
                  trigger={disabled ? 'mouseenter focus' : ''}
                  content={
                    disabled
                      ? t('Only available using eBPF with FlowCollector.agent.ebpf.features containing "PacketDrop"')
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
      <div className="pf-v6-c-menu__group">
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
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {useTopK ? t('Top / Bottom') : t('Limit')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        {values.map(l => (
          <div key={'limit-' + l}>
            <label className="display-dropdown-padding pf-v6-c-menu__menu-item">
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

export default QueryOptionsPanel;
