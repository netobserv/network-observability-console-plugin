import { Result } from '../result';

describe('Should map', () => {
  it('should map successes', () => {
    const r = Result.success(1).map(n => n + 1);
    expect(r).toEqual(Result.success(2));
  });

  it('should map errors', () => {
    const r = (Result.error('oops') as Result<number, string>).map(n => n + 1);
    expect(r).toEqual(Result.error('oops'));
  });
});

describe('Should flatMap', () => {
  it('should flatMap successes', () => {
    const r = Result.success({ r: Result.success(1) }).flatMap(n => n.r);
    expect(r).toEqual(Result.success(1));
  });

  it('should flatMap success + error', () => {
    const r = Result.success({ r: Result.error('oops') }).flatMap(n => n.r);
    expect(r).toEqual(Result.error('oops'));
  });

  it('should flatMap error', () => {
    const r = (Result.error('oops') as Result<{ r: Result<number, string> }, string>).flatMap(n => n.r);
    expect(r).toEqual(Result.error('oops'));
  });
});
