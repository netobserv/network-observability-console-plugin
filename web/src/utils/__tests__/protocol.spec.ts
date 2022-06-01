import { compareProtocols, formatProtocol } from '../protocol';
import { getFilterDefinitions } from '../filter-definitions';

const t = (k: string) => k;

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

describe('validateProtocol', () => {
  it('should accept empty double quotes for empty/undefined protocols', () => {
    const protocolFilter = getFilterDefinitions(t).find(f => f.id == 'protocol')!;
    expect(protocolFilter.validate(`""`)).toEqual({ val: '""' });
  });
});
