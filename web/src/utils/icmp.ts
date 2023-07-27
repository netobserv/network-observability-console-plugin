import { ReadOnlyValue, ReadOnlyValues } from './values';

// https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml
export const ICMP_PROTO = 1;
export const ICMP_V6_PROTO = 58;
export const ICMP_PROTOS = [ICMP_PROTO, ICMP_V6_PROTO];

//https://github.com/torvalds/linux/blob/master/include/uapi/linux/icmp.h
export const ICMP_TYPES: ReadOnlyValues = [
  { value: 0, name: 'ICMP_ECHOREPLY', description: 'Echo Reply' },
  { value: 3, name: 'ICMP_DEST_UNREACH', description: 'Destination Unreachable' },
  { value: 4, name: 'ICMP_SOURCE_QUENCH', description: 'Source Quench' },
  { value: 5, name: 'ICMP_REDIRECT', description: 'Redirect (change route)' },
  { value: 8, name: 'ICMP_ECHO', description: 'Echo Request' },
  { value: 11, name: 'ICMP_TIME_EXCEEDED', description: 'Time Exceeded' },
  { value: 12, name: 'ICMP_PARAMETERPROB', description: 'Parameter Problem' },
  { value: 13, name: 'ICMP_TIMESTAMP', description: 'Timestamp Request' },
  { value: 14, name: 'ICMP_TIMESTAMPREPLY', description: 'Timestamp Reply' },
  { value: 15, name: 'ICMP_INFO_REQUEST', description: 'Information Request' },
  { value: 16, name: 'ICMP_INFO_REPLY', description: 'Information Reply' },
  { value: 17, name: 'ICMP_ADDRESS', description: 'Address Mask Request' },
  { value: 18, name: 'ICMP_ADDRESSREPLY', description: 'Address Mask Reply' }
  //{ value: 18, name: 'NR_ICMP_TYPES' },
] as const;

const icmpTypesValues = ICMP_TYPES.map(v => v.value);
export type ICMP_TYPES_VALUES = typeof icmpTypesValues[number];

const icmpTypesNames = ICMP_TYPES.map(v => v.name);
export type ICMP_TYPE_NAMES = typeof icmpTypesNames[number];

export const ICMP_UNREACH_CODES: ReadOnlyValues = [
  { value: 0, name: 'ICMP_NET_UNREACH', description: 'Network Unreachable' },
  { value: 1, name: 'ICMP_HOST_UNREACH', description: 'Host Unreachable' },
  { value: 2, name: 'ICMP_PROT_UNREACH', description: 'Protocol Unreachable' },
  { value: 3, name: 'ICMP_PORT_UNREACH', description: 'Port Unreachable' },
  { value: 4, name: 'ICMP_FRAG_NEEDED', description: 'Fragmentation Needed/DF set' },
  { value: 5, name: 'ICMP_SR_FAILED', description: 'Source Route failed' },
  { value: 6, name: 'ICMP_NET_UNKNOWN' },
  { value: 7, name: 'ICMP_HOST_UNKNOWN' },
  { value: 8, name: 'ICMP_HOST_ISOLATED' },
  { value: 9, name: 'ICMP_NET_ANO' },
  { value: 10, name: 'ICMP_HOST_ANO' },
  { value: 11, name: 'ICMP_NET_UNR_TOS' },
  { value: 12, name: 'ICMP_HOST_UNR_TOS' },
  { value: 13, name: 'ICMP_PKT_FILTERED', description: 'Packet filtered' },
  { value: 14, name: 'ICMP_PREC_VIOLATION', description: 'Precedence violation' },
  { value: 15, name: 'ICMP_PREC_CUTOFF', description: 'Precedence cut off' }
  //{ value: 15, name: 'NR_ICMP_UNREACH', description: 'instead of hardcoding immediate value' },
] as const;

const icmpUnreachCodesValues = ICMP_UNREACH_CODES.map(v => v.value);
export type ICMP_UNREACH_CODES_VALUES = typeof icmpUnreachCodesValues[number];

const icmpUnreachCodesNames = ICMP_UNREACH_CODES.map(v => v.name);
export type ICMP_UNREACH_CODES_NAMES = typeof icmpUnreachCodesNames[number];

export const ICMP_REDIRECT_CODES: ReadOnlyValues = [
  { value: 0, name: 'ICMP_REDIR_NET', description: 'Redirect Net' },
  { value: 1, name: 'ICMP_REDIR_HOST', description: 'Redirect Host' },
  { value: 2, name: 'ICMP_REDIR_NETTOS', description: 'Redirect Net for TOS' },
  { value: 3, name: 'ICMP_REDIR_HOSTTOS', description: 'Redirect Host for TOS' }
] as const;

const icmpRedirectCodesValues = ICMP_REDIRECT_CODES.map(v => v.value);
export type ICMP_REDIRECT_CODES_VALUES = typeof icmpRedirectCodesValues[number];

const icmpRedirectCodesNames = ICMP_REDIRECT_CODES.map(v => v.name);
export type ICMP_REDIRECT_CODES_NAMES = typeof icmpRedirectCodesNames[number];

export const ICMP_TIME_EXCEEDED_CODES: ReadOnlyValues = [
  { value: 0, name: 'ICMP_EXC_TTL', description: 'TTL count exceeded' },
  { value: 1, name: 'ICMP_EXC_FRAGTIME', description: 'Fragment Reass time exceeded' }
] as const;

const icmpTimeExceededCodesValues = ICMP_TIME_EXCEEDED_CODES.map(v => v.value);
export type ICMP_TIME_EXCEEDED_CODES_VALUES = typeof icmpTimeExceededCodesValues[number];

const icmpTimeExceededCodesNames = ICMP_TIME_EXCEEDED_CODES.map(v => v.name);
export type ICMP_TIME_EXCEEDED_CODES_NAMES = typeof icmpTimeExceededCodesNames[number];

// https://github.com/torvalds/linux/blob/master/include/uapi/linux/icmpv6.h
export const ICMP_V6_TYPES: ReadOnlyValues = [
  { value: 1, name: 'ICMPV6_DEST_UNREACH', description: 'Destination Unreachable' },
  { value: 2, name: 'ICMPV6_PKT_TOOBIG', description: 'Packet Too Big' },
  { value: 3, name: 'ICMPV6_TIME_EXCEED', description: 'Time Exceeded' },
  { value: 4, name: 'ICMPV6_PARAMPROB', description: 'Parameter Problem' },
  { value: 128, name: 'ICMPV6_ECHO_REQUEST', description: 'Echo Request' },
  { value: 129, name: 'ICMPV6_ECHO_REPLY', description: 'Echo Reply' },
  { value: 130, name: 'ICMPV6_MGM_QUERY', description: 'Multicast Listener Query' },
  { value: 131, name: 'ICMPV6_MGM_REPORT', description: 'Multicast Listener Report' },
  { value: 132, name: 'ICMPV6_MGM_REDUCTION', description: 'Multicast Listener Done' },
  { value: 139, name: 'ICMPV6_NI_QUERY', description: 'ICMP Node Information Query' },
  { value: 140, name: 'ICMPV6_NI_REPLY', description: 'ICMP Node Information Response' },
  { value: 143, name: 'ICMPV6_MLD2_REPORT', description: 'Version 2 Multicast Listener Report' },
  { value: 144, name: 'ICMPV6_DHAAD_REQUEST', description: 'Home Agent Address Discovery Request Message' },
  { value: 145, name: 'ICMPV6_DHAAD_REPLY', description: 'Home Agent Address Discovery Reply Message' },
  { value: 146, name: 'ICMPV6_MOBILE_PREFIX_SOL', description: 'Mobile Prefix Solicitation' },
  { value: 147, name: 'ICMPV6_MOBILE_PREFIX_ADV', description: 'Mobile Prefix Advertisement' },
  { value: 151, name: 'ICMPV6_MRDISC_ADV', description: 'Multicast Router Advertisement' },
  { value: 160, name: 'ICMPV6_EXT_ECHO_REQUEST', description: 'Extended Echo Request' },
  { value: 161, name: 'ICMPV6_EXT_ECHO_REPLY', description: 'Extended Echo Reply' },
  { value: 255, name: 'ICMPV6_MSG_MAX', description: 'Reserved for expansion of ICMPv6 informational messages' }
] as const;

const icmpv6TypesValues = ICMP_V6_TYPES.map(v => v.value);
export type ICMP_V6_TYPES_VALUES = typeof icmpv6TypesValues[number];

const icmpv6TypesNames = ICMP_V6_TYPES.map(v => v.name);
export type ICMP_V6_TYPE_NAMES = typeof icmpv6TypesNames[number];

export const ICMP_V6_UNREACH_CODES: ReadOnlyValues = [
  { value: 0, name: 'ICMPV6_NOROUTE', description: 'no route to destination' },
  {
    value: 1,
    name: 'ICMPV6_ADM_PROHIBITED',
    description: 'communication with destination administratively prohibited'
  },
  { value: 2, name: 'ICMPV6_NOT_NEIGHBOUR', description: 'beyond scope of source address' },
  { value: 3, name: 'ICMPV6_ADDR_UNREACH', description: 'address unreachable' },
  { value: 4, name: 'ICMPV6_PORT_UNREACH', description: 'port unreachable' },
  { value: 5, name: 'ICMPV6_POLICY_FAIL', description: 'source address failed ingress/egress policy' },
  { value: 6, name: 'ICMPV6_REJECT_ROUTE', description: 'reject route to destination' }
] as const;

const icmpv6UnreachCodesValues = ICMP_V6_UNREACH_CODES.map(v => v.value);
export type ICMP_V6_UNREACH_CODES_VALUES = typeof icmpv6UnreachCodesValues[number];

const icmpv6UnreachCodesNames = ICMP_V6_UNREACH_CODES.map(v => v.name);
export type ICMP_V6_UNREACH_CODES_NAMES = typeof icmpv6UnreachCodesNames[number];

export const ICMP_V6_TIME_EXCEEDED_CODES: ReadOnlyValues = [
  { value: 0, name: 'ICMPV6_EXC_HOPLIMIT', description: 'hop limit exceeded in transit  ' },
  { value: 1, name: 'ICMPV6_EXC_FRAGTIME', description: 'fragment reassembly time exceeded  ' }
] as const;

const icmpv6TimeExceededCodesValues = ICMP_V6_TIME_EXCEEDED_CODES.map(v => v.value);
export type ICMP_V6_TIME_EXCEEDED_CODES_VALUES = typeof icmpv6TimeExceededCodesValues[number];

const icmpv6TimeExceededCodesNames = ICMP_V6_TIME_EXCEEDED_CODES.map(v => v.name);
export type ICMP_V6_TIME_EXCEEDED_CODES_NAMES = typeof icmpv6TimeExceededCodesNames[number];

export const ICMP_V6_PARAMPROB_CODES: ReadOnlyValues = [
  { value: 0, name: 'ICMPV6_HDR_FIELD', description: 'erroneous header field encountered' },
  { value: 1, name: 'ICMPV6_UNK_NEXTHDR', description: 'unrecognized Next Header type encountered' },
  { value: 2, name: 'ICMPV6_UNK_OPTION', description: 'unrecognized IPv6 option encountered' },
  { value: 3, name: 'ICMPV6_HDR_INCOMP', description: 'IPv6 First Fragment has incomplete IPv6 Header Chain' }
] as const;

const icmpv6ParamprobCodesValues = ICMP_V6_PARAMPROB_CODES.map(v => v.value);
export type ICMP_V6_PARAMPROB_CODES_VALUES = typeof icmpv6ParamprobCodesValues[number];

const icmpv6ParamprobCodesNames = ICMP_V6_PARAMPROB_CODES.map(v => v.name);
export type ICMP_V6_PARAMPROB_CODES_NAMES = typeof icmpv6ParamprobCodesNames[number];

export type ICMP_ALL_TYPES_VALUES = ICMP_TYPES_VALUES | ICMP_V6_TYPES_VALUES;

export type ICMP_ALL_CODES_VALUES =
  | ICMP_UNREACH_CODES_VALUES
  | ICMP_REDIRECT_CODES_VALUES
  | ICMP_TIME_EXCEEDED_CODES_VALUES
  | ICMP_V6_UNREACH_CODES_VALUES
  | ICMP_V6_TIME_EXCEEDED_CODES_VALUES
  | ICMP_V6_PARAMPROB_CODES_VALUES;

export const getICMPDocUrl = (p: number): string | undefined => {
  switch (p) {
    case ICMP_PROTO:
      return "https://github.com/torvalds/linux/blob/master/include/uapi/linux/icmp.h";
    case ICMP_V6_PROTO:
      return "https://github.com/torvalds/linux/blob/master/include/uapi/linux/icmpv6.h";
    default:
      return undefined;
  }
}

export const getICMPType = (p: number, v: ICMP_ALL_TYPES_VALUES): ReadOnlyValue | undefined => {
  if (!ICMP_PROTOS.includes(p)) {
    return undefined;
  }
  if (p === ICMP_PROTO) {
    return ICMP_TYPES.find(t => t.value === v);
  }
  return ICMP_V6_TYPES.find(t => t.value === v);
};

export const getICMPCode = (
  p: number,
  t?: ICMP_ALL_TYPES_VALUES,
  c?: ICMP_ALL_CODES_VALUES
): ReadOnlyValue | undefined => {
  if (!ICMP_PROTOS.includes(p) || !t || !c) {
    return undefined;
  }

  if (p == ICMP_PROTO) {
    switch (t) {
      case 3: // ICMP_DEST_UNREACH:
        return ICMP_UNREACH_CODES.find(v => v.value === c);
      case 5: // ICMP_REDIRECT:
        return ICMP_REDIRECT_CODES.find(v => v.value === c);
      case 11: // ICMP_TIME_EXCEEDED:
        return ICMP_TIME_EXCEEDED_CODES.find(v => v.value === c);
      default:
        return undefined;
    }
  }
  switch (t) {
    case 1: // ICMPV6_DEST_UNREACH
      return ICMP_V6_UNREACH_CODES.find(v => v.value === c);
    case 3: // ICMPV6_TIME_EXCEED
      return ICMP_V6_TIME_EXCEEDED_CODES.find(v => v.value === c);
    case 4: // ICMPV6_PARAMPROB
      return ICMP_V6_PARAMPROB_CODES.find(v => v.value === c);
    default:
      return undefined;
  }
};
