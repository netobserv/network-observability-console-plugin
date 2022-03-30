import { formatPort, comparePorts } from '../port';
import { Config } from '../../model/config';

const config = <Config>{ portNaming: { Enable: true, portNames: new Map<string, string>() } };

describe('formatport', () => {
  it('should format port', () => {
    expect(formatPort(443, config)).toEqual('https (443)');
    expect(formatPort(32876, config)).toEqual('32876');
  });
  it('should not format port above 1024', () => {
    expect(formatPort(3000, config)).toEqual('3000');
  });
  it('should format custom port', () => {
    config.portNaming.portNames.set('3100', 'loki');
    expect(formatPort(3100, config)).toEqual('loki (3100)');
  });
  it('should format custom port over default one', () => {
    const configHttp = <Config>{ portNaming: { Enable: true, portNames: new Map<string, string>() } };
    configHttp.portNaming.portNames.set('80', 'custom name');
    expect(formatPort(80, configHttp)).toEqual('custom name (80)');
  });
  it('should not format when disabled', () => {
    const configDisable = <Config>{ portNaming: { Enable: false, portNames: new Map<string, string>() } };
    expect(formatPort(80, configDisable)).toEqual('80');
  });
});

describe('comparePort', () => {
  it('should order known ports first compared to an unknown port', () => {
    expect(comparePorts(443, 73282, config)).toBeLessThan(0);
    expect(comparePorts(8282, 80, config)).toBeGreaterThan(0);
  });
  it('should order known ports alphabetically', () => {
    expect(comparePorts(53, 80, config)).toBeLessThan(0);
    expect(comparePorts(123, 80, config)).toBeGreaterThan(0);
  });
  it('should order unknown ports numerically', () => {
    expect(comparePorts(34890, 17239, config)).toBeGreaterThan(0);
    expect(comparePorts(9756, 17239, config)).toBeLessThan(0);
    expect(comparePorts(45392, 45392, config)).toEqual(0);
  });
});
