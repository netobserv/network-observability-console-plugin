/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Text, TextVariants } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../dynamic-loader/dynamic-loader';

export type ResourceStatusProps = {
  group: string;
  version: string;
  kind: string;
  existing: any | null;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
};

export const ResourceStatus: FC<ResourceStatusProps> = ({
  group,
  version,
  kind,
  existing,
  selectedTypes,
  setSelectedTypes
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  if (!existing) {
    return (
      <>
        <Text component={TextVariants.p}>{t("{{kind}} resource doesn't exists yet.", { kind })}</Text>
        <Button
          onClick={() => {
            navigate(`/k8s/cluster/${group}~${version}~${kind}/~new/form`);
          }}
        >
          {t('Create {{kind}}', { kind })}
        </Button>
      </>
    );
  }

  const conditions = (existing?.status?.conditions || []) as any[];
  return (
    <Table data-test={conditions.find(c => c.type === 'Ready')?.message} variant={'compact'}>
      <Thead>
        <Tr>
          <Th>{t('Type')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Reason')}</Th>
          <Th>{t('Message')}</Th>
          <Th>{t('Changed')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {conditions.map((condition, i) => (
          <Tr
            id={`${condition.type}-row`}
            data-test-status={`${condition.status}`}
            data-test-reason={`${condition.reason}`}
            key={i}
            isRowSelected={selectedTypes.includes(condition.type)}
            onClick={() => setSelectedTypes([condition.type])}
          >
            <Td>{condition.type}</Td>
            <Td>{condition.status}</Td>
            <Td>{condition.reason}</Td>
            <Td>{condition.message}</Td>
            <Td>{condition.lastTransitionTime}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default ResourceStatus;
