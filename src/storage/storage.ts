import { Stream } from "stream";

import { Option } from "../result/option";
import { EmptyResult, Result } from "../result/result";

export type StorageConfig = {
  name: string;
  config: string | unknown;
};

export const CONNECTION_STRING_EXPRESSION = "([a-zA-Z]+::.*)";

export function parseStorageLayerType(
  connectionString: string
): Result<StorageConfig> {
  const storageLayerType = connectionString.match(CONNECTION_STRING_EXPRESSION);

  if (!storageLayerType) {
    return Result.ofFailure(
      `Invalid storage layer connection string ${connectionString}. Connection string doesn't match the pattern ${CONNECTION_STRING_EXPRESSION}`
    );
  }

  const [name, config] = storageLayerType[0].split("::");

  return Result.ofOk({ name, config });
}

export interface Storage {
  saveLogs(containerId: string, logs: Stream): Promise<EmptyResult>;
  readLogs(containerId: string): Promise<Result<Option<Stream>>>;
  getLatestLogTimestamp(containerId: string): Promise<Result<Option<number>>>;
}
