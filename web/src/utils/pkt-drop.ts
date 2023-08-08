import { ReadOnlyValues } from './values';

// https://github.com/torvalds/linux/blob/master/include/net/tcp_states.h
export const DROP_STATES: ReadOnlyValues = [
  { value: 0, name: 'TCP_INVALID_STATE' },
  { value: 1, name: 'TCP_ESTABLISHED' },
  { value: 2, name: 'TCP_SYN_SENT' },
  { value: 3, name: 'TCP_SYN_RECV' },
  { value: 4, name: 'TCP_FIN_WAIT1' },
  { value: 5, name: 'TCP_FIN_WAIT2' },
  { value: 6, name: 'TCP_CLOSE' },
  { value: 7, name: 'TCP_CLOSE_WAIT' },
  { value: 8, name: 'TCP_LAST_ACK' },
  { value: 9, name: 'TCP_LISTEN' },
  { value: 10, name: 'TCP_CLOSING' },
  { value: 11, name: 'TCP_NEW_SYN_RECV' }
] as const;

const dropStatesValues = DROP_STATES.map(v => v.value);
export type DROP_STATES_VALUES = typeof dropStatesValues[number];

const dropStatesNames = DROP_STATES.map(v => v.name);
export type DROP_STATES_NAMES = typeof dropStatesNames[number];

// https://github.com/torvalds/linux/blob/master/include/net/dropreason-core.h
export const DROP_CAUSES: ReadOnlyValues = [
  { value: 2, name: 'SKB_DROP_REASON_NOT_SPECIFIED', description: 'drop reason is not specified' },
  { value: 3, name: 'SKB_DROP_REASON_NO_SOCKET', description: 'socket not found' },
  { value: 4, name: 'SKB_DROP_REASON_PKT_TOO_SMALL', description: 'packet size is too small' },
  { value: 5, name: 'SKB_DROP_REASON_TCP_CSUM', description: 'TCP checksum error' },
  { value: 6, name: 'SKB_DROP_REASON_SOCKET_FILTER', description: 'dropped by socket filter' },
  { value: 7, name: 'SKB_DROP_REASON_UDP_CSUM', description: 'UDP checksum error' },
  { value: 8, name: 'SKB_DROP_REASON_NETFILTER_DROP', description: 'dropped by netfilter' },
  {
    value: 9,
    name: 'SKB_DROP_REASON_OTHERHOST',
    description: "packet don't belong to current host. (interface is in promisc mode)"
  },
  { value: 10, name: 'SKB_DROP_REASON_IP_CSUM', description: 'IP checksum error' },
  {
    value: 11,
    name: 'SKB_DROP_REASON_IP_INHDR',
    description: 'there is something wrong with IP header (see IPSTATS_MIB_INHDRERRORS)'
  },
  {
    value: 12,
    name: 'SKB_DROP_REASON_IP_RPFILTER',
    description: 'IP rpfilter validate failed. see the document for rp_filter in ip-sysctl.rst for more information'
  },
  {
    value: 13,
    name: 'SKB_DROP_REASON_UNICAST_IN_L2_MULTICAST',
    description: 'destination address of L2 is multicast, but L3 is unicast.'
  },
  { value: 14, name: 'SKB_DROP_REASON_XFRM_POLICY', description: 'xfrm policy check failed' },
  { value: 15, name: 'SKB_DROP_REASON_IP_NOPROTO', description: 'no support for IP protocol' },
  { value: 16, name: 'SKB_DROP_REASON_SOCKET_RCVBUFF', description: 'socket receive buff is full' },
  {
    value: 17,
    name: 'SKB_DROP_REASON_PROTO_MEM',
    description: 'proto memory limition, such as udp packet drop out of udp_memory_allocated.'
  },
  {
    value: 18,
    name: 'SKB_DROP_REASON_TCP_MD5NOTFOUND',
    description: 'no MD5 hash and one expected, corresponding to LINUX_MIB_TCPMD5NOTFOUND'
  },
  {
    value: 19,
    name: 'SKB_DROP_REASON_TCP_MD5UNEXPECTED',
    description: "MD5 hash and we're not expecting one, corresponding to LINUX_MIB_TCPMD5UNEXPECTED"
  },
  {
    value: 20,
    name: 'SKB_DROP_REASON_TCP_MD5FAILURE',
    description: 'MD5 hash and its wrong, corresponding to LINUX_MIB_TCPMD5FAILURE'
  },
  {
    value: 21,
    name: 'SKB_DROP_REASON_SOCKET_BACKLOG',
    description: 'failed to add skb to socket backlog (see LINUX_MIB_TCPBACKLOGDROP)'
  },
  { value: 22, name: 'SKB_DROP_REASON_TCP_FLAGS', description: 'TCP flags invalid' },
  {
    value: 23,
    name: 'SKB_DROP_REASON_TCP_ZEROWINDOW',
    description: 'TCP receive window size is zero, see LINUX_MIB_TCPZEROWINDOWDROP'
  },
  {
    value: 24,
    name: 'SKB_DROP_REASON_TCP_OLD_DATA',
    description:
      'the TCP data reveived is already received before (spurious retrans may happened), see LINUX_MIB_DELAYEDACKLOST'
  },
  {
    value: 25,
    name: 'SKB_DROP_REASON_TCP_OVERWINDOW',
    description: 'the TCP data is out of window, the seq of the first byte exceed the right edges of receive window'
  },
  {
    value: 26,
    name: 'SKB_DROP_REASON_TCP_OFOMERGE',
    description: 'the data of skb is already in the ofo queue, corresponding to LINUX_MIB_TCPOFOMERGE'
  },
  {
    value: 27,
    name: 'SKB_DROP_REASON_TCP_RFC7323_PAWS',
    description: 'PAWS check, corresponding to LINUX_MIB_PAWSESTABREJECTED'
  },
  { value: 28, name: 'SKB_DROP_REASON_TCP_INVALID_SEQUENCE', description: 'Not acceptable SEQ field' },
  { value: 29, name: 'SKB_DROP_REASON_TCP_RESET', description: 'Invalid RST packet' },
  { value: 30, name: 'SKB_DROP_REASON_TCP_INVALID_SYN', description: 'Incoming packet has unexpected SYN flag' },
  { value: 31, name: 'SKB_DROP_REASON_TCP_CLOSE', description: 'TCP socket in CLOSE state' },
  { value: 32, name: 'SKB_DROP_REASON_TCP_FASTOPEN', description: 'dropped by FASTOPEN request socket' },
  { value: 33, name: 'SKB_DROP_REASON_TCP_OLD_ACK', description: 'TCP ACK is old, but in window' },
  { value: 34, name: 'SKB_DROP_REASON_TCP_TOO_OLD_ACK', description: 'TCP ACK is too old' },
  { value: 35, name: 'SKB_DROP_REASON_TCP_ACK_UNSENT_DATA', description: "TCP ACK for data we haven't sent yet" },
  { value: 36, name: 'SKB_DROP_REASON_TCP_OFO_QUEUE_PRUNE', description: 'pruned from TCP OFO queue' },
  { value: 37, name: 'SKB_DROP_REASON_TCP_OFO_DROP', description: 'data already in receive queue' },
  { value: 38, name: 'SKB_DROP_REASON_IP_OUTNOROUTES', description: 'route lookup failed' },
  {
    value: 39,
    name: 'SKB_DROP_REASON_BPF_CGROUP_EGRESS',
    description: 'dropped by BPF_PROG_TYPE_CGROUP_SKB eBPF program'
  },
  { value: 40, name: 'SKB_DROP_REASON_IPV6DISABLED', description: 'IPv6 is disabled on the device' },
  { value: 41, name: 'SKB_DROP_REASON_NEIGH_CREATEFAIL', description: 'failed to create neigh entry' },
  { value: 42, name: 'SKB_DROP_REASON_NEIGH_FAILED', description: 'neigh entry in failed state' },
  { value: 43, name: 'SKB_DROP_REASON_NEIGH_QUEUEFULL', description: 'arp_queue for neigh entry is full' },
  { value: 44, name: 'SKB_DROP_REASON_NEIGH_DEAD', description: 'neigh entry is dead' },
  { value: 45, name: 'SKB_DROP_REASON_TC_EGRESS', description: 'dropped in TC egress HOOK' },
  {
    value: 46,
    name: 'SKB_DROP_REASON_QDISC_DROP',
    description: 'dropped by qdisc when packet outputting (failed to enqueue to current qdisc)'
  },
  {
    value: 47,
    name: 'SKB_DROP_REASON_CPU_BACKLOG',
    description:
      'failed to enqueue the skb to the per CPU backlog queue. This can be caused by backlog queue full (see netdev_max_backlog in net.rst) or RPS flow limit'
  },
  { value: 48, name: 'SKB_DROP_REASON_XDP', description: 'dropped by XDP in input path' },
  { value: 49, name: 'SKB_DROP_REASON_TC_INGRESS', description: 'dropped in TC ingress HOOK' },
  { value: 50, name: 'SKB_DROP_REASON_UNHANDLED_PROTO', description: 'protocol not implemented or not supported' },
  { value: 51, name: 'SKB_DROP_REASON_SKB_CSUM', description: 'sk_buff checksum computation error' },
  { value: 52, name: 'SKB_DROP_REASON_SKB_GSO_SEG', description: 'gso segmentation error' },
  {
    value: 53,
    name: 'SKB_DROP_REASON_SKB_UCOPY_FAULT',
    description: 'ailed to copy data from user space, e.g., via zerocopy_sg_from_iter() or skb_orphan_frags_rx()'
  },
  { value: 54, name: 'SKB_DROP_REASON_DEV_HDR', description: 'device driver specific header/metadata is invalid' },
  {
    value: 55,
    name: 'SKB_DROP_REASON_DEV_READY',
    description:
      // eslint-disable-next-line max-len
      'the device is not ready to xmit/recv due to any of its data structure that is not up/ready/initialized, e.g., the IFF_UP is not set, or driver specific tun->tfiles[txq] is not initialized'
  },
  { value: 56, name: 'SKB_DROP_REASON_FULL_RING', description: 'ring buffer is full' },
  { value: 57, name: 'SKB_DROP_REASON_NOMEM', description: 'error due to OOM' },
  {
    value: 58,
    name: 'SKB_DROP_REASON_HDR_TRUNC',
    description:
      'failed to trunc/extract the header from networking data, e.g., failed to pull the protocol header from frags via pskb_may_pull()'
  },
  {
    value: 59,
    name: 'SKB_DROP_REASON_TAP_FILTER',
    description: 'dropped by (ebpf) filter directly attached to tun/tap, e.g., via TUNSETFILTEREBPF'
  },
  {
    value: 60,
    name: 'SKB_DROP_REASON_TAP_TXFILTER',
    description: 'dropped by tx filter implemented at tun/tap, e.g., check_filter()'
  },
  { value: 61, name: 'SKB_DROP_REASON_ICMP_CSUM', description: 'ICMP checksum error' },
  {
    value: 62,
    name: 'SKB_DROP_REASON_INVALID_PROTO',
    description: "the packet doesn't follow RFC 2211, such as a broadcasts ICMP_TIMESTAMP"
  },
  {
    value: 63,
    name: 'SKB_DROP_REASON_IP_INADDRERRORS',
    description: 'host unreachable, corresponding to IPSTATS_MIB_INADDRERRORS'
  },
  {
    value: 64,
    name: 'SKB_DROP_REASON_IP_INNOROUTES',
    description: 'network unreachable, corresponding to IPSTATS_MIB_INADDRERRORS'
  },
  { value: 65, name: 'SKB_DROP_REASON_PKT_TOO_BIG', description: 'packet size is too big (maybe exceed the MTU)' },
  { value: 66, name: 'SKB_DROP_REASON_DUP_FRAG', description: 'duplicate fragment' },
  { value: 67, name: 'SKB_DROP_REASON_FRAG_REASM_TIMEOUT', description: 'fragment reassembly timeout' },
  {
    value: 68,
    name: 'SKB_DROP_REASON_FRAG_TOO_FAR',
    description: 'ipv4 fragment too far. (/proc/sys/net/ipv4/ipfrag_max_dist)'
  },
  {
    value: 69,
    name: 'SKB_DROP_REASON_TCP_MINTTL',
    description: 'ipv4 ttl or ipv6 hoplimit below the threshold (IP_MINTTL or IPV6_MINHOPCOUNT)'
  },
  { value: 70, name: 'SKB_DROP_REASON_IPV6_BAD_EXTHDR', description: 'Bad IPv6 extension header' },
  { value: 71, name: 'SKB_DROP_REASON_IPV6_NDISC_FRAG', description: 'invalid frag (suppress_frag_ndisc)' },
  { value: 72, name: 'SKB_DROP_REASON_IPV6_NDISC_HOP_LIMIT', description: 'invalid hop limit' },
  { value: 73, name: 'SKB_DROP_REASON_IPV6_NDISC_BAD_CODE', description: 'invalid NDISC icmp6 code' },
  { value: 74, name: 'SKB_DROP_REASON_IPV6_NDISC_BAD_OPTIONS', description: 'invalid NDISC options' },
  { value: 75, name: 'SKB_DROP_REASON_IPV6_NDISC_NS_OTHERHOST', description: 'NEIGHBOUR SOLICITATION' }
] as const;

const dropCausesValues = DROP_CAUSES.map(v => v.value);
export type DROP_CAUSES_VALUES = typeof dropCausesValues[number];

const dropCausesNames = DROP_CAUSES.map(v => v.name);
export type DROP_CAUSES_NAMES = typeof dropCausesNames[number];

export const DROP_CAUSES_DOC_URL = 'https://github.com/torvalds/linux/blob/master/include/net/dropreason-core.h';

export const getDropCauseDescription = (name: DROP_CAUSES_NAMES): string => {
  return DROP_CAUSES.find(v => v.name === name)?.description || 'Unknown';
};