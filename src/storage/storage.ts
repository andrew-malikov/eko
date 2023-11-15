import { Stream } from "stream";

import { Option } from "../result/option";
import { EmptyResult, Result } from "../result/result";

export type StorageLayerType = {
  name: string;
  config: string | unknown;
};

export const CONNECTION_STRING_EXPRESSION = "([a-zA-Z]+::.*)";

export function ParseStorageLayerType(
  connectionString: string
): Result<StorageLayerType> {
  const storageLayerType = connectionString.match(CONNECTION_STRING_EXPRESSION);

  if (!storageLayerType) {
    return Result.ofFailure(
      `Invalid storage layer connection string ${connectionString}. Connection string doesn't match the pattern ${CONNECTION_STRING_EXPRESSION}`
    );
  }

  const [name, config] = storageLayerType[0].split("::");

  return Result.ofOk({ name, config });
}

export interface StorageLayer {
  saveLogs(logs: Stream): Promise<EmptyResult>;
  readLogs(containerId: string): Promise<Result<Option<Stream>>>;
}
