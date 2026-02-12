export class Result<T, E> {
  result?: T;
  error?: E;
  constructor(result: T | undefined, error: E | undefined) {
    this.result = result;
    this.error = error;
  }

  map<O>(this: Result<T, E>, fn: (i: T) => O | undefined): Result<O, E> {
    return new Result(this.result ? fn(this.result) : undefined, this.error);
  }

  mapError<O>(this: Result<T, E>, fn: (i: E) => O): Result<T, O> {
    return new Result(this.result, this.error ? fn(this.error) : undefined);
  }

  flatMap<O>(this: Result<T, E>, fn: (i: T) => Result<O, E>): Result<O, E> {
    if (this.result) {
      return fn(this.result);
    }
    return new Result<O, E>(undefined, this.error);
  }

  or(this: Result<T, E>, ifError: T): T {
    return this.result || ifError;
  }

  static success = <T, E>(result: T): Result<T, E> => {
    return new Result<T, E>(result, undefined);
  };

  static error = <T, E>(error: E): Result<T, E> => {
    return new Result<T, E>(undefined, error);
  };

  static fromNullable = <T, E>(from?: Result<T, E>): Result<T, E> => {
    return new Result(from?.result, from?.error);
  };

  static fromPromise = <T>(promise: Promise<T>): Promise<Result<T, unknown>> => {
    return promise.then(t => Result.success(t)).catch(err => Result.error(err));
  };
}
