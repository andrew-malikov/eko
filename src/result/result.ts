export class EmptyResult {
  static ofOk(): EmptyOk {
    return new EmptyOk();
  }

  static ofFailure(message: string, error?: unknown): EmptyFailure {
    if (error instanceof Error) {
      return new EmptyFailure(message, error);
    }

    return new EmptyFailure(message);
  }
}

export class EmptyOk extends EmptyResult {}

export class EmptyFailure extends EmptyResult {
  constructor(public message: string, public error?: Error) {
    super();
  }
}

export class Result<TData> {
  static ofOk<TData>(data: TData): Ok<TData> {
    return new Ok<TData>(data);
  }

  static ofFailure<TData>(message: string, error?: unknown) {
    if (error instanceof Error) {
      return new Failure<TData>(message, error);
    }

    return new Failure<TData>(message);
  }

  asOk(): TData {
    if (this instanceof Ok) {
      return this.data;
    }

    throw new Error("Failed to cast Result to Ok because it isn't one.");
  }

  map<TNewData>(fn: (data: TData) => TNewData): Result<TNewData> {
    if (this instanceof Failure) {
      return this.map();
    }

    return Result.ofOk(fn((this as unknown as Ok<TData>).data));
  }
}

export class Ok<TData> extends Result<TData> {
  constructor(public data: TData) {
    super();
  }
}

export class Failure<TData> extends Result<TData> {
  constructor(public message: string, public error?: Error) {
    super();
  }

  asEmpty(): EmptyFailure {
    return this;
  }

  map<TNext>(): Failure<TNext> {
    return new Failure<TNext>(this.message, this.error);
  }
}
