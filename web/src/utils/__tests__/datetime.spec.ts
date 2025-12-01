import { TFunction } from 'react-i18next';
import { formatActiveSince, toISODateString, twentyFourHourTime } from '../datetime';
import { getLanguage } from '../language';

describe('datetime', () => {
  it('should toISODateString', () => {
    expect(toISODateString(new Date('1985-10-26T01:21:00'))).toBe('1985-10-26');
    expect(toISODateString(new Date('2015-10-21T07:28:00'))).toBe('2015-10-21');
    expect(toISODateString(new Date('1955-11-05T06:15:00'))).toBe('1955-11-05');
  });

  it('should twentyFourHourTime', () => {
    expect(twentyFourHourTime(new Date('1985-10-26T01:21:00'))).toBe('01:21');
    expect(twentyFourHourTime(new Date('2015-10-21T07:28:00'))).toBe('07:28');
    expect(twentyFourHourTime(new Date('1955-11-05T06:15:00'))).toBe('06:15');
  });
});

describe('formatActiveSince', () => {
  const FIXED_NOW = new Date('2025-11-27T15:00:00');
  const tMock: TFunction = ((key: string) => key) as unknown as TFunction;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should format "today" as only time', () => {
    const ts = '2025-11-27T10:15:00';
    const date = new Date(ts);

    const expectedTime = twentyFourHourTime(date, false);

    const result = formatActiveSince(tMock, ts);

    expect(result).toBe(expectedTime);
  });

  it('should format "yesterday" as "Yesterday, HH:MM"', () => {
    const ts = '2025-11-26T22:00:00';
    const date = new Date(ts);

    const expectedTime = twentyFourHourTime(date, false);

    const result = formatActiveSince(tMock, ts);

    expect(result).toBe(`Yesterday, ${expectedTime}`);
  });

  it('should format dates within the last 7 days as "Weekday, HH:MM"', () => {
    const ts = '2025-11-25T09:30:00';
    const date = new Date(ts);

    const weekdayFormatter = new Intl.DateTimeFormat(getLanguage(), {
      weekday: 'short'
    });
    const weekday = weekdayFormatter.format(date);
    const time = twentyFourHourTime(date, false);

    const result = formatActiveSince(tMock, ts);

    expect(result).toBe(`${weekday}, ${time}`);
  });

  it('should format older dates with "YYYY-MM-DD HH:MM"', () => {
    const ts = '2025-11-07T14:00:00';
    const date = new Date(ts);

    const expectedDate = toISODateString(date);
    const expectedTime = twentyFourHourTime(date, false);

    const result = formatActiveSince(tMock, ts);

    expect(result).toBe(`${expectedDate} ${expectedTime}`);
  });
});
