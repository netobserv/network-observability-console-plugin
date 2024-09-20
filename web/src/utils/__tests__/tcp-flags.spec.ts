import { decomposeTCPFlagsBitfield } from '../tcp-flags';

describe('TCP flags', () => {
  it('should decompose', () => {
    const flags528 = decomposeTCPFlagsBitfield(528);
    expect(flags528).toHaveLength(2);
    expect(flags528.map(f => f.name)).toEqual(['ACK', 'FIN_ACK']);

    const flags256 = decomposeTCPFlagsBitfield(256);
    expect(flags256).toHaveLength(1);
    expect(flags256.map(f => f.name)).toEqual(['SYN_ACK']);

    const flags666 = decomposeTCPFlagsBitfield(666);
    expect(flags666).toHaveLength(5);
    expect(flags666.map(f => f.name)).toEqual(['SYN', 'PSH', 'ACK', 'CWR', 'FIN_ACK']);
  });
});
