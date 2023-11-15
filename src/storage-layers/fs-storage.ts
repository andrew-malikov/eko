import { Stream } from "stream";

import { Option } from "../result/option";
import { EmptyResult, Result } from "../result/result";
import { StorageLayer } from "../storage/storage";

export class FsStorage implements StorageLayer {
  saveLogs(logs: Stream): Promise<EmptyResult> {
    throw new Error("Method not implemented.");
  }

  readLogs(containerId: string): Promise<Result<Option<Stream>>> {
    throw new Error("Method not implemented.");
  }
}
