import { compareIPs, validateIPFilter } from '../ip';

describe('ipcompare', () => {
  it('should compare two ips', () => {
    expect(compareIPs('10.10.10.10', '10.10.10.10')).toEqual(0);
    expect(compareIPs('10.10.10.10', '20.10.10.10')).toBeLessThan(0);
    expect(compareIPs('10.10.10.10', '10.30.10.10')).toBeLessThan(0);
    expect(compareIPs('10.10.10.10', '10.10.40.10')).toBeLessThan(0);
    expect(compareIPs('10.10.10.10', '10.10.10.50')).toBeLessThan(0);
    expect(compareIPs('9.0.0.0', '8.8.8.8')).toBeGreaterThan(0);
    expect(compareIPs('8.50.100.100', '8.8.8.8')).toBeGreaterThan(0);
    expect(compareIPs('8.8.100.100', '8.8.8.8')).toBeGreaterThan(0);
    expect(compareIPs('8.8.8.255', '8.8.8.8')).toBeGreaterThan(0);
  });
});

describe('validate IP filter', () => {
  it('should validate correct IP filters', () => {
    expect(validateIPFilter('1.3.3.4')).toBe(true);
    expect(validateIPFilter('1.3.3.4-1.3.4.6')).toBe(true);
    expect(validateIPFilter('1.3.3.4/24')).toBe(true);
    expect(validateIPFilter('::1')).toBe(true);
    expect(validateIPFilter('0001:0db8:0000:0000:34f4:0000:0000:f3dd')).toBe(true);
    expect(validateIPFilter('::1-::6')).toBe(true);
    expect(validateIPFilter('0001:0db8:0000:0000:34f4:0000:0000:f3dd/16')).toBe(true);
    expect(validateIPFilter('1:2:3:4:5:6:7:8')).toBe(true);
    expect(validateIPFilter('1::-1:2:3:4:5:6:7::')).toBe(true);
    expect(validateIPFilter('1::8-1:2:3:4:5:6::8')).toBe(true);
    expect(validateIPFilter('1::7:8')).toBe(true);
    expect(validateIPFilter('1:2:3:4:5::7:8')).toBe(true);
    expect(validateIPFilter('1:2:3:4:5::8')).toBe(true);
    expect(validateIPFilter('1::6:7:8')).toBe(true);
    expect(validateIPFilter('1:2:3:4::6:7:8')).toBe(true);
    expect(validateIPFilter('1:2:3:4::8')).toBe(true);
    expect(validateIPFilter('1::5:6:7:8')).toBe(true);
    expect(validateIPFilter('1:2:3::5:6:7:8')).toBe(true);
    expect(validateIPFilter('1:2:3::8')).toBe(true);
    expect(validateIPFilter('1::4:5:6:7:8')).toBe(true);
    expect(validateIPFilter('1:2::4:5:6:7:8')).toBe(true);
    expect(validateIPFilter('1:2::8')).toBe(true);
    expect(validateIPFilter('1::3:4:5:6:7:8')).toBe(true);
    expect(validateIPFilter('1::3:4:5:6:7:8')).toBe(true);
    expect(validateIPFilter('1::8')).toBe(true);
    expect(validateIPFilter('::2:3:4:5:6:7:8')).toBe(true);
    expect(validateIPFilter('::8')).toBe(true);
    expect(validateIPFilter('::')).toBe(true);
    //link-local IPv6 addresses with zone index
    expect(validateIPFilter('fe80::7:8%eth0')).toBe(true);
    expect(validateIPFilter('fe80::7:8%1')).toBe(true);
    //IPv4-mapped IPv6 addresses and IPv4-translated addresses
    expect(validateIPFilter('::255.255.255.255')).toBe(true);
    expect(validateIPFilter('::ffff:255.255.255.255')).toBe(true);
    expect(validateIPFilter('::ffff:0:255.255.255.255')).toBe(true);
    //IPv4-Embedded IPv6 Address
    expect(validateIPFilter('2001:db8:3:4::192.0.2.33')).toBe(true);
    expect(validateIPFilter('64:ff9b::192.0.2.33')).toBe(true);
  });
  it('should not validate wrong IP filters', () => {
    expect(validateIPFilter('1.3.3')).toBe(false);
    expect(validateIPFilter('1.3.3.4-1.3.4.678')).toBe(false);
    expect(validateIPFilter('1.3.3.4/66')).toBe(false);
    expect(validateIPFilter('1.3.3.4/z')).toBe(false);
    expect(validateIPFilter(':::::')).toBe(false);
    expect(validateIPFilter('0001:0db8:0000:0000:34f4:0000:0000:zzzz')).toBe(false);
    expect(validateIPFilter('::1-0:0:0')).toBe(false);
    expect(validateIPFilter('0001:0db8:0000:0000:34f4:0000:0000:f3dd/132')).toBe(false);
    expect(validateIPFilter('1.3.3.4-::1')).toBe(false);
    expect(validateIPFilter('1.3.3.4-')).toBe(false);
    expect(validateIPFilter('1.3.3.4/')).toBe(false);
    expect(validateIPFilter('1.3.3.4/3.2.1.0')).toBe(false);
  });
});
