import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Popover, Text, TextVariants } from '@patternfly/react-core';
import * as _ from 'lodash';
import { FilterType } from '../utils/filters';

interface FilterHintsProps {
  type: FilterType;
  name: string;
}

export const FilterHints: React.FC<FilterHintsProps> = ({ type, name }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  let hint = '';
  let examples = '';
  switch (type) {
    case FilterType.PORT:
      hint = t('Specify a single port number or name.');
      examples = `${t('Specify a single port following one of these rules:')}
      - ${t('A port number like 80, 21')}
      - ${t('A IANA name like HTTP, FTP')}`;
      break;
    case FilterType.ADDRESS:
      hint = t('Specify a single address or range.');
      examples = `${t('Specify addresses following one of these rules:')}
      - ${t('A single IPv4 or IPv6 address like 192.0.2.0, ::1')}
      - ${t('A range within the IP address like 192.168.0.1-192.189.10.12, 2001:db8::1-2001:db8::8')}
      - ${t('A CIDR specification like 192.51.100.0/24, 2001:db8::/32')}`;
      break;
    case FilterType.PROTOCOL:
      hint = t('Specify a single protocol number or name.');
      examples = `${t('Specify a single protocol following one of these rules:')}
        - ${t('A protocol number like 6, 17')}
        - ${t('A IANA name like TCP, UDP')}`;
      break;
    case FilterType.NAMESPACE:
    case FilterType.K8S_OBJECT:
    case FilterType.K8S_NAMES:
      hint = t('Specify a single kubernetes name.');
      examples = `${t('Specify a single kubernetes name following these rules:')}
      - ${t('Containing any alphanumeric, hyphen, underscrore or dot character')}
      - ${t('Partial text like cluster, cluster-image, image-registry')}
      - ${t('Exact match using quotes like "cluster-image-registry"')}
      - ${t('Case sensitive match using quotes like "Deployment"')}
      - ${t('Starting text like cluster, "cluster-*"')}
      - ${t('Ending text like "*-registry"')}
      - ${t('Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-')}`;
      break;
    case FilterType.KIND_NAMESPACE_NAME:
      hint = t('Specify an existing resource from its kind, namespace and name.');
      examples = `${t('Specify a kind, namespace and name from existing:')}
            - ${t('Select kind first from suggestions')}
            - ${t('Then Select namespace from suggestions')}
            - ${t('Finally select name from suggestions')}
            ${t('You can also directly specify a kind, namespace and name like pod.openshift.apiserver')}`;
      break;
    case FilterType.ADDRESS_PORT:
      hint = t('Specify a single address or range with port');
      examples = `${t('Specify addresses and port following one of these rules:')}
      - ${t('A single IPv4 address with port like 192.0.2.0:8080')}
      - ${t('A range within the IP address like 192.168.0.1-192.189.10.12:8080')}
      - ${t('A CIDR specification like 192.51.100.0/24:8080')}`;
      break;
    default:
      hint = '';
      examples = '';
      break;
  }
  return (
    <div id="tips">
      <Text component={TextVariants.p}>{hint}</Text>
      {!_.isEmpty(examples) ? (
        <Popover
          aria-label="Hint popover"
          headerContent={name}
          bodyContent={<div className="text-left-pre">{examples}</div>}
          hasAutoWidth={true}
          position={'bottom'}
        >
          <Button id="more" variant="link">
            {t('Learn more')}
          </Button>
        </Popover>
      ) : undefined}
    </div>
  );
};
