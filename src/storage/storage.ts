import { Stream } from "stream";

import { Option } from "../result/option";
import { EmptyResult, Result } from "../result/result";

export type StorageDefinition = {
  name: string;
  connectionString: string;
};

export const STORAGE_DEFINITION_EXPRESSION = "([a-zA-Z]+::.*)";

export function parseStorageDefinition(
  storageDefinition: string
): Result<StorageDefinition> {
  const storageLayerType = storageDefinition.match(
    STORAGE_DEFINITION_EXPRESSION
  );

  if (!storageLayerType) {
    return Result.ofFailure(
      `Invalid storage definition ${storageDefinition}. Storage definition doesn't match the pattern ${STORAGE_DEFINITION_EXPRESSION}`
    );
  }

  // TODO: use matched expression instead of spliting
  const [name, connectionString] = storageLayerType[0].split("::");

  return Result.ofOk({ name, connectionString });
}

export class StorageMetadata {
  constructor(
    public readonly name: string,
    public readonly connectionString: string
  ) {}

  toString(): string {
    return `${this.name}::${this.connectionString}`;
  }
}

export interface Storage {
  saveLogs(containerId: string, logs: Stream): Promise<EmptyResult>;
  readLogs(containerId: string): Promise<Result<Option<Stream>>>;
  getLatestLogTimestamp(containerId: string): Promise<Result<Option<number>>>;
  isHealthy(): Promise<boolean>;
  getStorageMetadata(): StorageMetadata;
}

export type GetStorage = (
  definition: StorageDefinition
) => Promise<Result<Storage>>;
