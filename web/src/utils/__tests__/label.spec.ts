import { validateK8SName } from '../label';

describe('K8S name validation', () => {
  it('should validate partial match starting and ending with hyphen', () => {
    expect(validateK8SName('-123-abc-')).toBe(true);
  });

  it('should validate partial match with upper-case', () => {
    expect(validateK8SName('AbC')).toBe(true);
  });

  it('should validate partial match with allowed special chars', () => {
    expect(validateK8SName('ab*c')).toBe(true);
  });

  it('should validate partial match node name with dots', () => {
    expect(validateK8SName('ip-10-0-131-71.ec2.internal')).toBe(true);
  });

  it('should invalidate partial match with disallowed special chars', () => {
    expect(validateK8SName('ab_c')).toBe(false);
    expect(validateK8SName('ab"c')).toBe(false);
    expect(validateK8SName('ab/c')).toBe(false);
    expect(validateK8SName('ab\\c')).toBe(false);
    expect(validateK8SName('ab|c')).toBe(false);
    expect(validateK8SName('ab&c')).toBe(false);
  });

  it('should validate empty string (and not panic)', () => {
    expect(validateK8SName('')).toBe(true);
  });

  it('should validate exact match', () => {
    expect(validateK8SName('"a-1"')).toBe(true);
  });

  it('should validate exact match node name with dots', () => {
    expect(validateK8SName('"ip-10-0-131-71.ec2.internal"')).toBe(true);
  });

  it('should invalidate exact match with special chars', () => {
    expect(validateK8SName('"ab@c"')).toBe(false);
    expect(validateK8SName('"ab/c"')).toBe(false);
    expect(validateK8SName('"ab|c"')).toBe(false);
    expect(validateK8SName('"ab&c"')).toBe(false);
    expect(validateK8SName('"ab?c"')).toBe(false);
    expect(validateK8SName('"ab*c"')).toBe(false);
  });

  it('should invalidate exact match starting with hyphen', () => {
    expect(validateK8SName('"-abc"')).toBe(false);
  });

  it('should invalidate exact match ending with hyphen', () => {
    expect(validateK8SName('"abc-"')).toBe(false);
  });

  it('should invalidate empty exact match (and not panic)', () => {
    expect(validateK8SName('""')).toBe(false);
  });
});
