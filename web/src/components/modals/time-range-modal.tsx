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
  const { t } = useTranslation('plugin__netobserv-plugin');
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

  //this is a hack to allow user to type into date / time inputs without having to delete previous content
  const onInput = (e: React.FormEvent<HTMLDivElement>, type: 'date' | 'time') => {
    const input = e.target as HTMLInputElement;
    const inputEvent = e.nativeEvent as InputEvent;

    //save cursor position
    let start = input.selectionStart as number;
    let end = input.selectionEnd as number;

    //split date / time accordingly
    const delimiter = type === 'date' ? '-' : ':';
    const valueParts = input.value.split(delimiter);

    //hack delimiters only when caracters are added one by one
    if (start === end && inputEvent.inputType === 'insertText' && inputEvent.data !== delimiter) {
      //new caracter has been added before the delimiter, we need to move it to the next part
      switch (type) {
        case 'date':
          if (start === 5 && valueParts.length > 1) {
            valueParts[1] = inputEvent.data + valueParts[1];
            start++;
          } else if (start === 8 && valueParts.length > 2) {
            valueParts[2] = inputEvent.data + valueParts[2];
            start++;
          }
          break;
        case 'time':
          if (start === 3 && valueParts.length > 1) {
            valueParts[1] = inputEvent.data + valueParts[1];
            start++;
          } else if (start === 6 && valueParts.length > 2) {
            valueParts[2] = inputEvent.data + valueParts[2];
            start++;
          }
          break;
      }
      end = start;
    }

    let truncatedValue = '';
    for (let i = 0; i < 3; i++) {
      if (truncatedValue.length) {
        truncatedValue += delimiter;
      }

      const isYear = type === 'date' && i === 0;
      if (valueParts.length > i) {
        const len = isYear ? 4 : 2;
        truncatedValue += valueParts[i].slice(0, len).padEnd(len, '0');
      } else {
        truncatedValue += isYear ? '0000' : '00';
      }
    }

    //update input value
    input.value = truncatedValue;

    //restore position
    input.setSelectionRange(start, end);
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
      data-test={id}
      id={id}
      title={t('Custom time range')}
      isOpen={isModalOpen}
      scrollable={false}
      onClose={() => onCancel()}
      footer={
        <div>
          <Button data-test="time-range-cancel" key="cancel" variant="link" onClick={() => onCancel()}>
            {t('Cancel')}
          </Button>
          <Tooltip
            //css hide tooltip here to avoid render issue
            className={'time-range-tooltip' + (_.isEmpty(error) ? '-empty' : '')}
            content={error}
            isVisible={error !== undefined}
          >
            <Button
              data-test="time-range-save"
              isDisabled={error !== undefined}
              key="confirm"
              variant="primary"
              onClick={() => onSave()}
            >
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
          <Flex direction={{ default: 'row' }} className="time-range-row">
            <FlexItem>
              <DatePicker
                data-test="from-date-picker"
                validators={[date => dateValidator(true, date)]}
                onChange={str => setFromDate(str)}
                onInput={e => onInput(e, 'date')}
                value={fromDate}
              />
            </FlexItem>
            <FlexItem>
              <TimePicker
                data-test="from-time-picker"
                is24Hour
                includeSeconds
                placeholder="hh:mm:ss"
                onChange={setFromTime}
                onInput={e => onInput(e, 'time')}
                time={displayedFromTime}
              />
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem>
          <Text component={TextVariants.h4}>{t('To')}</Text>
          <Flex direction={{ default: 'row' }} className="time-range-row">
            <FlexItem>
              <DatePicker
                data-test="to-date-picker"
                validators={[date => dateValidator(false, date)]}
                rangeStart={fromDate ? new Date(Date.parse(fromDate)) : undefined}
                onChange={str => setToDate(str)}
                onInput={e => onInput(e, 'date')}
                value={toDate}
              />
            </FlexItem>
            <FlexItem>
              <TimePicker
                data-test="to-time-picker"
                is24Hour
                includeSeconds
                placeholder="hh:mm:ss"
                onChange={setToTime}
                onInput={e => onInput(e, 'time')}
                time={displayedToTime}
              />
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    </Modal>
  );
};

export default TimeRangeModal;
