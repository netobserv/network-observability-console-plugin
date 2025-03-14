import React, { FC } from 'react';

import { PageSection, PageSectionVariants } from '@patternfly/react-core';

type FlowMetricFormProps = {};

const FlowMetricForm: FC<FlowMetricFormProps> = (props) => {
  console.log(props);
  return (
    <PageSection variant={PageSectionVariants.light}>{'FlowMetric form'}</PageSection>
  );
};

export default FlowMetricForm;
