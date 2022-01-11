import { compareProtocols, formatProtocol } from '../protocol';

describe('formatProtocol', () => {
  it('should format protocol', () => {
    expect(formatProtocol(6)).toEqual('TCP');
    expect(formatProtocol(17)).toEqual('UDP');
    expect(formatProtocol(0)).toEqual('HOPOPT');
  });
});

describe('compareProtocol', () => {
  // 6=TCP, 17=UDP, 121=SMP
  it('should sort protocols by name in natural order', () => {
    const sorted = [6, 17, undefined, 121].sort(compareProtocols);
    expect(sorted).toEqual([121, 6, 17, undefined]);
  });
});
