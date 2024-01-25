import { formatDuration, formatDurationAboveMillisecond } from '../duration';

describe('duration', () => {
  it('should format duration', () => {
    expect(formatDuration(1000)).toBe('1s');
    expect(formatDuration(1500)).toBe('1s');
    expect(formatDuration(1800)).toBe('1s');
    expect(formatDuration(180000)).toBe('3m');
    expect(formatDuration(200000)).toBe('3m 20s');
  });

  it('should not format too small duration', () => {
    expect(formatDuration(50)).toBe('');
    expect(formatDuration(500)).toBe('');
    expect(formatDuration(900)).toBe('');
  });

  it('should format duration above millisecond', () => {
    expect(formatDurationAboveMillisecond(1000)).toBe('1s');
    expect(formatDurationAboveMillisecond(1500)).toBe('1s');
    expect(formatDurationAboveMillisecond(1800)).toBe('1s');
    expect(formatDurationAboveMillisecond(180000)).toBe('3m');
    expect(formatDurationAboveMillisecond(200000)).toBe('3m 20s');
    expect(formatDurationAboveMillisecond(50)).toBe('50ms');
    expect(formatDurationAboveMillisecond(500)).toBe('500ms');
    expect(formatDurationAboveMillisecond(900)).toBe('900ms');
  });
});
