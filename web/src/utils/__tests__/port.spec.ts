import { formatPort, comparePort } from '../port';

describe('formatport', () => {
  it('should format port', () => {
    expect(formatPort(443)).toEqual('https (443)');
    expect(formatPort(32876)).toEqual('32876');
  });
});

describe('comparePort', () => {
  it('should order known ports first compared to an unknown port', () => {
    expect(comparePort(443, 73282)).toBeLessThan(0);
    expect(comparePort(8282, 80)).toBeGreaterThan(0);
  });
  it('should order known ports alphabetically', () => {
    expect(comparePort(53, 80)).toBeLessThan(0);
    expect(comparePort(123, 80)).toBeGreaterThan(0);
  });
  it('should order unknown ports numerically', () => {
    expect(comparePort(34890, 17239)).toBeGreaterThan(0);
    expect(comparePort(9756, 17239)).toBeLessThan(0);
    expect(comparePort(45392, 45392)).toEqual(0);
  });
});

// toBeGreaterThan
