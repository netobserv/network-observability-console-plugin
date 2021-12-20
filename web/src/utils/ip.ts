export const ipCompare = (ip1: string, ip2: string) => {
  const splitIp2 = ip2.split(".");
  const tmpRes = ip1
    .split(".")
    .map((num, i) => Number(num) - Number(splitIp2[i]));
  for (const res of tmpRes) {
    if (res != 0) {
      return res;
    }
  }
  return 0;
};
