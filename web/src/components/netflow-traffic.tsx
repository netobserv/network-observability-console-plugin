import * as React from 'react';
import { Fragment } from 'react';
import * as _ from 'lodash';
import { useResolvedExtensions, isModelFeatureFlag, ModelFeatureFlag } from '@openshift-console/dynamic-plugin-sdk';
import { getFlows } from '../api/routes';
import { ParsedStream } from '../api/loki';
import NetflowTable from './netflow-table';
import { PageSection, Button } from '@patternfly/react-core';
import {
  OverflowMenu,
  OverflowMenuGroup,
  OverflowMenuItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip
} from '@patternfly/react-core';
import { ColumnsIcon, SyncAltIcon } from '@patternfly/react-icons';
import { Column, ColumnsId } from './netflow-table-header';
import { useTranslation } from 'react-i18next';
import { ColumnsModal } from './columns-modal';
import { RefreshDropdown } from './refresh-dropdown';
import { usePoll } from '../utils/poll-hook';
import './netflow-traffic.css';

export const NetflowTraffic: React.FC = () => {
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  const [loading, setLoading] = React.useState(false);
  const [flows, setFlows] = React.useState<ParsedStream[]>([]);
  const [error, setError] = React.useState(undefined);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const { t } = useTranslation('plugin__network-observability-plugin');

  const [columns, setColumns] = React.useState<Column[]>([
    { id: ColumnsId.date, name: t('Date & time'), isSelected: true, defaultOrder: 1 },
    { id: ColumnsId.srcpod, name: t('Src pod'), isSelected: true, defaultOrder: 2 },
    { id: ColumnsId.dstpod, name: t('Dst pod'), isSelected: true, defaultOrder: 3 },
    { id: ColumnsId.srcnamespace, name: t('Src namespace'), isSelected: true, defaultOrder: 4 },
    { id: ColumnsId.dstnamespace, name: t('Dst namespace'), isSelected: true, defaultOrder: 5 },
    { id: ColumnsId.srcport, name: t('Src port'), isSelected: true, defaultOrder: 6 },
    { id: ColumnsId.dstport, name: t('Dst port'), isSelected: true, defaultOrder: 7 },
    { id: ColumnsId.protocol, name: t('Protocol'), isSelected: true, defaultOrder: 8 },
    { id: ColumnsId.bytes, name: t('Bytes'), isSelected: true, defaultOrder: 9 },
    { id: ColumnsId.packets, name: t('Packets'), isSelected: true, defaultOrder: 10 }
  ]);
  const toolbarItems = (
    <Fragment>
      <ToolbarItem>
        <OverflowMenu breakpoint="md">
          <OverflowMenuGroup groupType="button" isPersistent>
            <OverflowMenuItem>
              <Tooltip content={t('Manage columns')}>
                <Button
                  id="manage-columns-button"
                  variant="plain"
                  onClick={() => setModalOpen(true)}
                  aria-label={t('Column management')}
                >
                  <ColumnsIcon color="#6A6E73" />
                </Button>
              </Tooltip>
            </OverflowMenuItem>
          </OverflowMenuGroup>
        </OverflowMenu>
      </ToolbarItem>
      {/* TODO : NETOBSERV-104
      <ToolbarItem variant="pagination">
        <Pagination
          itemCount={flows.length}
          widgetId="pagination-options-menu-bottom"
          page={1}
          variant={PaginationVariant.top}
          isCompact
        />
      </ToolbarItem>*/}
    </Fragment>
  );

  const [interval, setInterval] = React.useState<number | null>(null);
  const tick = () => {
    setLoading(true);
    getFlows()
      .then(streams => {
        setFlows(streams);
        setError(undefined);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  };
  usePoll(tick, interval);

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection">
      <h1 className="co-m-pane__heading">
        <span>Network Traffic</span>
        <div className="co-actions">
          <RefreshDropdown id="refresh-dropdown" interval={interval} setInterval={setInterval} />
          <Button
            id="refresh-button"
            className="co-action-refresh-button"
            variant="primary"
            onClick={() => tick()}
            icon={<SyncAltIcon style={{ animation: `spin ${loading ? 1 : 0}s linear infinite` }} />}
          />
        </div>
      </h1>
      <Toolbar id="filter-toolbar">
        <ToolbarContent>{toolbarItems}</ToolbarContent>
      </Toolbar>
      {error && <div>Error: {error}</div>}
      {!_.isEmpty(flows) && (
        <NetflowTable flows={flows} setFlows={setFlows} columns={columns.filter(col => col.isSelected)} />
      )}
      <ColumnsModal
        id="columns-modal"
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        columns={columns}
        setColumns={setColumns}
      />
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
