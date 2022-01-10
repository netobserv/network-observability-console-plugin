import { toISODateString, twentyFourHourTime } from '../datetime';

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
