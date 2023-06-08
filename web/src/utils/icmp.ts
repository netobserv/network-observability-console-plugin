/** TODO: remove this file, when replaced https://github.com/netobserv/flowlogs-pipeline/pull/429/files#r1219203830 */

/** see https://elixir.bootlin.com/linux/latest/source/include/uapi/linux/icmp.h */

enum ICMP_TYPES {
  ICMP_ECHOREPLY = 0 /* Echo Reply			*/,
  ICMP_DEST_UNREACH = 3 /* Destination Unreachable	*/,
  ICMP_SOURCE_QUENCH = 4 /* Source Quench		*/,
  ICMP_REDIRECT = 5 /* Redirect (change route)	*/,
  ICMP_ECHO = 8 /* Echo Request			*/,
  ICMP_TIME_EXCEEDED = 11 /* Time Exceeded		*/,
  ICMP_PARAMETERPROB = 12 /* Parameter Problem		*/,
  ICMP_TIMESTAMP = 13 /* Timestamp Request		*/,
  ICMP_TIMESTAMPREPLY = 14 /* Timestamp Reply		*/,
  ICMP_INFO_REQUEST = 15 /* Information Request		*/,
  ICMP_INFO_REPLY = 16 /* Information Reply		*/,
  ICMP_ADDRESS = 17 /* Address Mask Request		*/,
  ICMP_ADDRESSREPLY = 18 /* Address Mask Reply		*/,
  NR_ICMP_TYPES = 18
}

enum ICMP_UNREACH_CODES {
  ICMP_NET_UNREACH = 0 /* Network Unreachable		*/,
  ICMP_HOST_UNREACH = 1 /* Host Unreachable		*/,
  ICMP_PROT_UNREACH = 2 /* Protocol Unreachable		*/,
  ICMP_PORT_UNREACH = 3 /* Port Unreachable		*/,
  ICMP_FRAG_NEEDED = 4 /* Fragmentation Needed/DF set	*/,
  ICMP_SR_FAILED = 5 /* Source Route failed		*/,
  ICMP_NET_UNKNOWN = 6,
  ICMP_HOST_UNKNOWN = 7,
  ICMP_HOST_ISOLATED = 8,
  ICMP_NET_ANO = 9,
  ICMP_HOST_ANO = 10,
  ICMP_NET_UNR_TOS = 11,
  ICMP_HOST_UNR_TOS = 12,
  ICMP_PKT_FILTERED = 13 /* Packet filtered */,
  ICMP_PREC_VIOLATION = 14 /* Precedence violation */,
  ICMP_PREC_CUTOFF = 15 /* Precedence cut off */,
  NR_ICMP_UNREACH = 15 /* instead of hardcoding immediate value */
}

enum ICMP_REDIRECT_CODES {
  ICMP_REDIR_NET = 0 /* Redirect Net			*/,
  ICMP_REDIR_HOST = 1 /* Redirect Host		*/,
  ICMP_REDIR_NETTOS = 2 /* Redirect Net for TOS		*/,
  ICMP_REDIR_HOSTTOS = 3 /* Redirect Host for TOS	*/
}

enum ICMP_TIME_EXCEEDED_CODES {
  ICMP_EXC_TTL = 0 /* TTL count exceeded		*/,
  ICMP_EXC_FRAGTIME = 1 /* Fragment Reass time exceeded	*/
}

export const getType = (v?: number): string => {
  if (!v) {
    return '';
  }
  return ICMP_TYPES[v];
};

export const getCode = (t?: number, v?: number): string => {
  if (!t || !v) {
    return '';
  }
  switch (t) {
    case ICMP_TYPES.ICMP_DEST_UNREACH:
      return ICMP_UNREACH_CODES[v];
    case ICMP_TYPES.ICMP_REDIRECT:
      return ICMP_REDIRECT_CODES[v];
    case ICMP_TYPES.ICMP_TIME_EXCEEDED:
      return ICMP_TIME_EXCEEDED_CODES[v];
    default:
      return `Code: ${v}`;
  }
};
