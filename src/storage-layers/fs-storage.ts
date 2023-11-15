import { Stream } from "stream";
import path from "path";
import { access, mkdir, writeFile, readFile } from "fs/promises";

import { Option } from "../result/option";
import { EmptyResult, Result } from "../result/result";
import { Storage } from "../storage/storage";
import { createReadStream, createWriteStream } from "fs";

export class FsStorage implements Storage {
  constructor(private directory: string) {}

  async saveLogs(containerId: string, logs: Stream): Promise<EmptyResult> {
    try {
      const containerDirectory = path.join(this.directory, containerId);
      await mkdir(containerDirectory, { recursive: true });
      const containerLogFile = path.join(containerDirectory, "log");

      const writeStream = createWriteStream(containerLogFile);
      logs.pipe(writeStream);

      logs.on("close", () => {
        writeStream.close();
      });

      logs.on("finish", () => {
        writeStream.close();
      });

      return EmptyResult.ofOk();
    } catch (error) {
      return EmptyResult.ofFailure(
        "Failed to save logs into a container log file.",
        error
      );
    }
  }

  async readLogs(containerId: string): Promise<Result<Option<Stream>>> {
    try {
      const containerLogFile = path.join(this.directory, containerId, "log");

      try {
        await access(containerLogFile);
      } catch {
        return Result.ofOk(null);
      }

      return Result.ofOk(createReadStream(containerLogFile));
    } catch (error) {
      return Result.ofFailure("Failed to retrieve container logs", error);
    }
  }

  getLatestLogTimestamp(containerId: string): Promise<Result<Option<number>>> {
    throw new Error("Method not implemented.");
  }
}

export async function getFsStorage(
  connectionString: string
): Promise<Result<Storage>> {
  try {
    mkdir(connectionString, { recursive: true });
    await access(connectionString);
  } catch (error) {
    return Result.ofFailure(
      "Failed to create folder for the connection string",
      error
    );
  }

  return Result.ofOk(new FsStorage(connectionString));
}
