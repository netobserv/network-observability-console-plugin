import { ipCompare } from '../ip';

describe('ipcompare', () => {
  it('should compare two ips', () => {
    expect(ipCompare('10.10.10.10', '10.10.10.10')).toEqual(0);
    expect(ipCompare('10.10.10.10', '20.10.10.10')).toBeLessThan(0);
    expect(ipCompare('10.10.10.10', '10.30.10.10')).toBeLessThan(0);
    expect(ipCompare('10.10.10.10', '10.10.40.10')).toBeLessThan(0);
    expect(ipCompare('10.10.10.10', '10.10.10.50')).toBeLessThan(0);
    expect(ipCompare('9.0.0.0', '8.8.8.8')).toBeGreaterThan(0);
    expect(ipCompare('8.50.100.100', '8.8.8.8')).toBeGreaterThan(0);
    expect(ipCompare('8.8.100.100', '8.8.8.8')).toBeGreaterThan(0);
    expect(ipCompare('8.8.8.255', '8.8.8.8')).toBeGreaterThan(0);
  });
});
