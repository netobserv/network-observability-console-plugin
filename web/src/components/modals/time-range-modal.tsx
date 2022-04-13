import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import Modal from './modal';
import {
  Text,
  Button,
  DatePicker,
  Flex,
  FlexItem,
  isValidDate,
  TimePicker,
  Tooltip,
  TextVariants
} from '@patternfly/react-core';
import { TimeRange, toISODateString, twentyFourHourTime } from '../../utils/datetime';
import { getDateMsInSeconds, getDateSInMiliseconds } from '../../utils/duration';
import './time-range-modal.css';

export interface TimeRangeModalProps {
  isModalOpen: boolean;
  setModalOpen: (v: boolean) => void;
  range?: TimeRange;
  setRange: (r: TimeRange) => void;
  id?: string;
}

export const TimeRangeModal: React.FC<TimeRangeModalProps> = ({ id, isModalOpen, setModalOpen, range, setRange }) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<string | undefined>();
  const [fromDate, setFromDate] = React.useState<string | undefined>();
  const [fromTime, setFromTime] = React.useState<string | undefined>();
  const [toDate, setToDate] = React.useState<string | undefined>();
  const [toTime, setToTime] = React.useState<string | undefined>();

  const dateValidator = (isFrom: boolean, date: Date): string => {
    const d = new Date(isFrom ? Date.parse(`${toDate} ${toTime}`) : Date.parse(`${fromDate} ${fromTime}`));
    if (isFrom && date > new Date()) {
      return t('From date cannot be in the future');
    }
    return !isValidDate(d) || (!isFrom && date >= d) || (isFrom && date <= d)
      ? ''
      : t('To date must be after From date');
  };

  const resetInputs = React.useCallback(() => {
    let from: Date;
    let to: Date;
    if (range && !Number.isNaN(range.from) && !Number.isNaN(range.to)) {
      from = new Date(getDateSInMiliseconds(range.from));
      to = new Date(getDateSInMiliseconds(range.to));
    } else {
      from = new Date();
      to = new Date();
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 0, 0);
    }

    setFromDate(toISODateString(from));
    setFromTime(twentyFourHourTime(from));
    setToDate(toISODateString(to));
    setToTime(twentyFourHourTime(to));
  }, [range]);

  const onCancel = React.useCallback(() => {
    resetInputs();
    setModalOpen(false);
  }, [resetInputs, setModalOpen]);

  const onSave = React.useCallback(() => {
    const from = getDateMsInSeconds(Date.parse(`${fromDate} ${fromTime}`));
    const to = getDateMsInSeconds(Date.parse(`${toDate} ${toTime}`));
    setRange({ from, to });
  }, [fromDate, fromTime, setRange, toDate, toTime]);

  React.useEffect(() => {
    const from = new Date(Date.parse(`${fromDate} ${fromTime}`));
    const to = new Date(Date.parse(`${toDate} ${toTime}`));
    if (!isValidDate(from) || !isValidDate(to)) {
      setError(t('Invalid date / time'));
    } else if (from > new Date()) {
      setError(t('From date cannot be in the future'));
    } else if (to.getTime() < from.getTime()) {
      setError(t('To date must be after From date'));
    } else {
      setError(undefined);
    }
  }, [fromDate, fromTime, t, toDate, toTime]);

  //set date / time on range change
  React.useEffect(() => {
    resetInputs();
  }, [range, resetInputs]);

  return (
    <Modal
      id={id}
      title={t('Custom time range')}
      isOpen={isModalOpen}
      scrollable={false}
      onClose={() => onCancel()}
      footer={
        <div>
          <Button key="cancel" variant="link" onClick={() => onCancel()}>
            {t('Cancel')}
          </Button>
          <Tooltip
            //css hide tooltip here to avoid render issue
            className={'time-range-tooltip' + (_.isEmpty(error) ? '-empty' : '')}
            content={error}
            isVisible={error !== undefined}
          >
            <Button isDisabled={error !== undefined} key="confirm" variant="primary" onClick={() => onSave()}>
              {t('Save')}
            </Button>
          </Tooltip>
        </div>
      }
    >
      <Flex direction={{ default: 'column' }}>
        <FlexItem>
          <Text component={TextVariants.h4}>{t('From')}</Text>
          <Flex direction={{ default: 'row' }}>
            <FlexItem>
              <DatePicker
                validators={[date => dateValidator(true, date)]}
                onChange={str => setFromDate(str)}
                value={fromDate}
              />
            </FlexItem>
            <FlexItem>
              <TimePicker is24Hour onChange={setFromTime} time={fromTime} />
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem>
          <Text component={TextVariants.h4}>{t('To')}</Text>
          <Flex direction={{ default: 'row' }}>
            <FlexItem>
              <DatePicker
                validators={[date => dateValidator(false, date)]}
                rangeStart={fromDate ? new Date(Date.parse(fromDate)) : undefined}
                onChange={str => setToDate(str)}
                value={toDate}
              />
            </FlexItem>
            <FlexItem>
              <TimePicker is24Hour onChange={setToTime} time={toTime} />
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    </Modal>
  );
};

export default TimeRangeModal;
