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
  TextVariants,
  TextContent
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

//keep displayed values separated. These will be set at startup to avoid TimePicker to loose value on every render
let displayedFromTime: string | undefined;
let displayedToTime: string | undefined;

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
    setFromTime(twentyFourHourTime(from, true));
    setToDate(toISODateString(to));
    setToTime(twentyFourHourTime(to, true));
  }, [range]);

  const onCancel = React.useCallback(() => {
    resetInputs();
    setModalOpen(false);
  }, [resetInputs, setModalOpen]);

  const onSave = React.useCallback(() => {
    //update time inputs
    displayedFromTime = fromTime;
    displayedToTime = toTime;
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

  //set display values
  React.useEffect(() => {
    if (!displayedFromTime) {
      displayedFromTime = fromTime;
    }
    if (!displayedToTime) {
      displayedToTime = toTime;
    }
  }, [fromTime, toTime]);

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
      <TextContent>
        <Text component={TextVariants.p}>
          {t('Select a custom time range. Flows are selected based on their End Time value.')}
        </Text>
      </TextContent>
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
              <TimePicker
                is24Hour
                includeSeconds
                placeholder="hh:mm:ss"
                onChange={setFromTime}
                time={displayedFromTime}
              />
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
              <TimePicker is24Hour includeSeconds placeholder="hh:mm:ss" onChange={setToTime} time={displayedToTime} />
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    </Modal>
  );
};

export default TimeRangeModal;
