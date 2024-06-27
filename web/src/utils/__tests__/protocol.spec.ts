import { FilterDefinitionSample } from '../../components/__tests-data__/filters';
import { compareProtocols, formatProtocol } from '../protocol';

describe('formatProtocol', () => {
  it('should format protocol', () => {
    expect(formatProtocol(6, v => v)).toEqual('TCP');
    expect(formatProtocol(17, v => v)).toEqual('UDP');
    expect(formatProtocol(0, v => v)).toEqual('HOPOPT');
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
    const protocolFilter = FilterDefinitionSample.find(f => f.id == 'protocol')!;
    expect(protocolFilter.validate(`""`)).toEqual({ val: '""' });
  });
});
