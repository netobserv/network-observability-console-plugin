import { getHTTPErrorDetails } from '../errors';

type Response = { data: { [key: string]: string } };
class CustomError extends Error {
  constructor(code: number, public msg: string, public response: Response) {
    super(`[${code}] ${msg}`);
  }
}

describe('getHTTPErrorDetails', () => {
  it('should build error from JSON', () => {
    const err = {
      response: {
        data: {
          message: 'there was an error',
          code: 'ABCD'
        }
      }
    };
    expect(getHTTPErrorDetails(err)).toEqual('there was an error\nABCD');
  });
  it('should build error from thrown Error', () => {
    const err = new Error('there was an error [code=ABCD]');
    expect(getHTTPErrorDetails(err)).toEqual('Error: there was an error [code=ABCD]');
  });
  it('should build error from plain text', () => {
    const err = {
      response: {
        data: 'there was an error'
      }
    };
    expect(getHTTPErrorDetails(err)).toEqual('there was an error');
  });
  it('should build error from CustomError', () => {
    const err = new CustomError(404, 'not found', { data: { details: 'file xyz not found on server' } });
    expect(getHTTPErrorDetails(err)).toEqual('Error: [404] not found\nfile xyz not found on server');
  });
  it('should build error from unexpected response', () => {
    const err = 'unexpected response';
    expect(getHTTPErrorDetails(err)).toEqual('unexpected response');
  });
});
