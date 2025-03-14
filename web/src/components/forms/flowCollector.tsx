import React, { FC } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import { PageSection, PageSectionVariants } from '@patternfly/react-core';
import { FlowCollector } from './templates';
import { safeYAMLToJS } from '../../utils/yaml';

type FlowCollectorFormProps = {};

const FlowCollectorForm: FC<FlowCollectorFormProps> = (props) => {
  console.log(props);

  const [formData, setFormData] = React.useState(safeYAMLToJS(FlowCollector));

  return (
    <PageSection variant={PageSectionVariants.light}>
      {'FlowMetric form'}
      <Form
        schema={{ type: 'string' }}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        validator={validator}
      />
    </PageSection>
  );
};

export default FlowCollectorForm;
