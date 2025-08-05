import { Bullseye, EmptyState, EmptyStateIcon, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as React from 'react';
import * as _ from 'lodash';

import { useTranslation } from 'react-i18next';
import { ByResource, getRulesPreview } from './helper';
import { ThSortType } from '@patternfly/react-table/dist/esm/components/Table/base/types';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { RuleDetails } from './rule-details';

export interface HealthViolationTableProps {
  title: string;
  stats: ByResource[];
  kind?: string;
}

type Column = {
  title: string;
  value: (r: ByResource) => string | number;
  display?: (r: ByResource) => JSX.Element;
  sort: ThSortType;
};

export const HealthViolationTable: React.FC<HealthViolationTableProps> = ({ title, stats, kind }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>(undefined);
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [expandedRowNames, setExpandedRowNames] = React.useState<string[]>([]);

  const buildSortParams = (index: number, defaultDir: 'asc' | 'desc'): ThSortType => {
    return {
      columnIndex: index,
      sortBy: {
        index: activeSortIndex,
        direction: activeSortDirection,
        defaultDirection: defaultDir
      },
      onSort: (_event, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }
    };
  }

  const columns: Column[] = [
    {
      title: t('Name'),
      value: (r: ByResource) => r.name,
      display: (r: ByResource) => {
        return kind ? (
          <ResourceLink inline={true} kind={kind} name={r.name}/>
        ) : t('(global)')
      },
      sort: buildSortParams(0, 'asc')
    },
    {
      title: t('Critical'),
      value: (r: ByResource) => r.critical.firing.length,
      sort: buildSortParams(1, 'desc')
    },
    {
      title: t('Warning'),
      value: (r: ByResource) => r.warning.firing.length,
      sort: buildSortParams(2, 'desc')
    },
    {
      title: t('Other'),
      value: (r: ByResource) => r.other.firing.length,
      sort: buildSortParams(3, 'desc')
    },
    {
      title: t('Pending'),
      value: (r: ByResource) => r.critical.pending.length + r.warning.pending.length + r.other.pending.length,
      sort: buildSortParams(4, 'desc')
    },
    {
      title: t('Silenced'),
      value: (r: ByResource) => r.critical.silenced.length + r.warning.silenced.length + r.other.silenced.length,
      sort: buildSortParams(5, 'desc')
    },
    {
      title: t('Rules'),
      value: (r: ByResource) => getRulesPreview(r),
      sort: buildSortParams(6, 'asc')
    },
  ];
  const nbCols = columns.length + 1;

  let sortIndex = activeSortIndex;
  if (sortIndex === undefined) {
    sortIndex = 1; // critical
    if (!stats.some(r => r.critical.firing.length > 0)) {
      if (stats.some(r => r.warning.firing.length > 0)) {
        sortIndex = 2; // warning
      } else if (stats.some(r => r.other.firing.length > 0)) {
        sortIndex = 3; // other
      }
    }
  }

  const sorted = _.orderBy(stats, columns[sortIndex].value, activeSortDirection);

  const toggleExpanded = (name: string) => {
    const index = expandedRowNames.indexOf(name);
    const newExpanded: string[] = index >= 0
      ? [...expandedRowNames.slice(0, index), ...expandedRowNames.slice(index + 1, expandedRowNames.length)]
      : [...expandedRowNames, name];
    setExpandedRowNames(newExpanded);
  }

  return (
    <>
      <TextContent>
        <Text component={TextVariants.p}>
          <Text component={TextVariants.h3}>{title}</Text>
          <Table
            data-test-rows-count={sorted.length}
            aria-label="Alerting rules"
            variant="compact"
            isStickyHeader
            // isExpandable
          >
            <Thead>
              <Tr>
                <Th screenReaderText="Row expansion" />
                {columns.map(c => (<Th sort={c.sort}>{c.title}</Th>))}
              </Tr>
            </Thead>
            {sorted.length === 0 && (
              <Tbody id="table-body" data-test="table-body">
                <Tr>
                  <Td colSpan={nbCols}>
                    <Bullseye>
                      <EmptyState>
                        <EmptyStateIcon icon={CheckCircleIcon} />
                        <Title headingLevel="h2">
                          {t('No violations found')}
                        </Title>
                      </EmptyState>
                    </Bullseye>
                  </Td>
                </Tr>
              </Tbody>
            )}
            {sorted.map((r, i) => (
              <Tbody key={'table-body-'+i} data-test={'table-body-'+i}>
                <>
                  <Tr>
                  {/* <Tr isExpanded={expandedRowNames.includes(String(r[colNameId]))}> */}
                    <Td
                      expand={{
                        rowIndex: i,
                        isExpanded: expandedRowNames.includes(r.name),
                        onToggle: () => toggleExpanded(r.name),
                        expandId: 'expandable'
                      }}
                    />
                    {columns.map(c => (<Td>{c.display ? c.display(r) : c.value(r)}</Td>))}
                  </Tr>
                  {expandedRowNames.includes(r.name) && (
                    <Tr>
                      <Td colSpan={nbCols}>
                        <RuleDetails info={r}/>
                      </Td>
                    </Tr>
                  )}
                </>
              </Tbody>
            ))}
          </Table>
        </Text>
      </TextContent>
    </>
  );
};
