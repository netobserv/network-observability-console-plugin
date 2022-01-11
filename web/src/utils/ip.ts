export const ipCompare = (ip1: string, ip2: string) => {
  const splitIp2 = ip2.split('.');
  const tmpRes = ip1.split('.').map((num, i) => Number(num) - Number(splitIp2[i]));
  for (const res of tmpRes) {
    if (res != 0) {
      return res;
    }
  }
  return 0;
};

/**
 * Validates an IP filter string to match any of the following:
 * - A single IPv4 or IPv6 address. Examples: 192.0.2.0, ::1
 * - A range within the IP address. Examples: 192.168.0.1-192.189.10.12, 2001:db8::1-2001:db8::8
 * - A CIDR specification. Examples: 192.51.100.0/24, 2001:db8::/32
 */
export const validateIPFilter = (ipFilter: string) => {
  ipFilter = ipFilter.trim();
  if (ipv4.test(ipFilter) || ipv6.test(ipFilter)) {
    return true;
  }
  const ips = ipFilter.split('-');
  if (ips?.length == 2) {
    // validates IPs in range
    return (ipv4.test(ips[0]) && ipv4.test(ips[1])) || (ipv6.test(ips[0]) && ipv6.test(ips[1]));
  }
  // validates whether it's a CIDR notation
  const ipRange = ipFilter.split('/');
  if (ipRange?.length != 2 || ipRange[1].length == 0 || isNaN(Number(ipRange[1]))) {
    return false;
  }
  const [ip, range] = [ipRange[0], Number(ipRange[1])];
  return (range >= 0 && range <= 32 && ipv4.test(ip)) || (range >= 0 && range <= 128 && ipv6.test(ip));
};

const ipv4Seg = '(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])';
const ipv4Addr = `(${ipv4Seg}\\.){3,3}${ipv4Seg}`;
const ipv6Seg = `[0-9a-fA-F]{1,4}`;
const ipv4 = RegExp(`^${ipv4Addr}$`);
const ipv6 = RegExp(
  `^(` +
    `(${ipv6Seg}:){7,7}${ipv6Seg}|` + //         1:2:3:4:5:6:7:8
    `(${ipv6Seg}:){1,7}:|` + //                  1::                                 1:2:3:4:5:6:7::
    `(${ipv6Seg}:){1,6}:${ipv6Seg}|` + //        1::8               1:2:3:4:5:6::8   1:2:3:4:5:6::8
    `(${ipv6Seg}:){1,5}(:${ipv6Seg}){1,2}|` + // 1::7:8             1:2:3:4:5::7:8   1:2:3:4:5::8
    `(${ipv6Seg}:){1,4}(:${ipv6Seg}){1,3}|` + // 1::6:7:8           1:2:3:4::6:7:8   1:2:3:4::8
    `(${ipv6Seg}:){1,3}(:${ipv6Seg}){1,4}|` + // 1::5:6:7:8         1:2:3::5:6:7:8   1:2:3::8
    `(${ipv6Seg}:){1,2}(:${ipv6Seg}){1,5}|` + // 1::4:5:6:7:8       1:2::4:5:6:7:8   1:2::8
    `${ipv6Seg}:((:${ipv6Seg}){1,6})|` + //      1::3:4:5:6:7:8     1::3:4:5:6:7:8   1::8
    `:((:${ipv6Seg}){1,7}|:)|` + //              ::2:3:4:5:6:7:8    ::2:3:4:5:6:7:8  ::8       ::
    `fe80:(:${ipv6Seg}){0,4}%[0-9a-zA-Z]{1,}|` + // link-local IPv6 addresses with zone index e.g. fe80::7:8%eth0
    `::(ffff(:0{1,4}){0,1}:){0,1}${ipv4Addr}|` + // IPv4-mapped/-translated IPV6 addresses e.g. ::255.255.255.255
    `(${ipv6Seg}:){1,4}:${ipv4Addr}` + // IPv4-Embedded IPv6 Address e.g. 2001:db8:3:4::192.0.2.33
    `)$`
);
