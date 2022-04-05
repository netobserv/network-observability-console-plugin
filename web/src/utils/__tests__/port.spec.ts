import { formatPort, comparePorts } from '../port';
import { config } from '../config';

describe('formatport', () => {
  beforeEach(() => {
    // Reset default config
    config.portNaming = {
      enable: true,
      portNames: new Map<string, string>()
    };
  });

  it('should format port', () => {
    expect(formatPort(443)).toEqual('https (443)');
    expect(formatPort(32876)).toEqual('32876');
  });
  it('should not format port above 1024', () => {
    expect(formatPort(3000)).toEqual('3000');
  });
  it('should format custom port', () => {
    config.portNaming.portNames.set('3100', 'loki');
    expect(formatPort(3100)).toEqual('loki (3100)');
  });
  it('should format custom port over default one', () => {
    config.portNaming.portNames.set('80', 'custom name');
    expect(formatPort(80)).toEqual('custom name (80)');
  });
  it('should not format when disabled', () => {
    config.portNaming.enable = false;
    expect(formatPort(80)).toEqual('80');
  });
});

describe('comparePort', () => {
  it('should order known ports first compared to an unknown port', () => {
    expect(comparePorts(443, 73282)).toBeLessThan(0);
    expect(comparePorts(8282, 80)).toBeGreaterThan(0);
  });
  it('should order known ports alphabetically', () => {
    expect(comparePorts(53, 80)).toBeLessThan(0);
    expect(comparePorts(123, 80)).toBeGreaterThan(0);
  });
  it('should order unknown ports numerically', () => {
    expect(comparePorts(34890, 17239)).toBeGreaterThan(0);
    expect(comparePorts(9756, 17239)).toBeLessThan(0);
    expect(comparePorts(45392, 45392)).toEqual(0);
  });
});
