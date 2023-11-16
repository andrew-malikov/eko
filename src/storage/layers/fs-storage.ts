import { Duplex, PassThrough, Stream } from "stream";
import path from "path";
import { access, mkdir, readdir } from "fs/promises";

import { Option } from "../../result/option";
import { EmptyResult, Result } from "../../result/result";
import { Storage, StorageMetadata } from "../storage";
import { createReadStream, createWriteStream } from "fs";

export class FsStorage implements Storage {
  constructor(private baseDirectory: string) {}

  getStorageMetadata(): StorageMetadata {
    return {
      name: "fs",
      connectionString: this.baseDirectory,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      access(this.baseDirectory);
      return true;
    } catch {
      return false;
    }
  }

  async getLoggedContainers(): Promise<Result<string[]>> {
    try {
      const containerDirs = await readdir(this.baseDirectory);
      return Result.ofOk(containerDirs);
    } catch (error) {
      return Result.ofFailure(
        "Failed to retrieve logged containers list.",
        error
      );
    }
  }

  async saveLogs(containerId: string, logs: Stream): Promise<EmptyResult> {
    try {
      const containerDirectory = path.join(this.baseDirectory, containerId);
      await mkdir(containerDirectory, { recursive: true });
      const containerLogFile = path.join(containerDirectory, "log");

      const writeStream = createWriteStream(containerLogFile);
      logs.pipe(writeStream);

      return new Promise((resolve, reject) => {
        logs.on("close", () => {
          resolve(EmptyResult.ofOk);
        });

        logs.on("finish", () => {
          resolve(EmptyResult.ofOk);
        });
      });
    } catch (error) {
      return EmptyResult.ofFailure(
        "Failed to save logs into a container log file.",
        error
      );
    }
  }

  async readLogs(containerId: string): Promise<Result<Option<Stream>>> {
    try {
      const containerLogFile = path.join(
        this.baseDirectory,
        containerId,
        "log"
      );

      try {
        await access(containerLogFile);
      } catch {
        return Result.ofOk(null);
      }

      return infinitelyListenFile(containerLogFile);
    } catch (error) {
      return Result.ofFailure("Failed to retrieve container logs", error);
    }
  }

  getLatestLogTimestamp(containerId: string): Promise<Result<Option<number>>> {
    throw new Error("Method not implemented.");
  }
}

function infinitelyListenFile(filePath: string): Result<Duplex> {
  const subscribeToFileStream = (
    filePath: string,
    onData: (data: string | Buffer) => void
  ) => {
    let lastReadPosition = 0;
    let originalLogsStream = createReadStream(filePath, {});

    const recieveData = (data: string | Buffer) => {
      lastReadPosition += data.length;
      onData(data);
    };

    const subscribeToNewStream = () => {
      originalLogsStream = createReadStream(filePath, {
        start: lastReadPosition,
      });

      originalLogsStream.on("data", recieveData);
      originalLogsStream.once("end", () =>
        setTimeout(subscribeToNewStream, 1000)
      );
    };

    subscribeToNewStream();
  };

  const outputStream = new PassThrough();

  subscribeToFileStream(filePath, (data) => {
    outputStream.write(data);
    outputStream.resume();
  });

  return Result.ofOk(outputStream);
}

export async function getFsStorage(
  baseDirectory: string
): Promise<Result<Storage>> {
  try {
    await mkdir(baseDirectory, { recursive: true });
    await access(baseDirectory);
  } catch (error) {
    return Result.ofFailure(
      "Failed to create folder for the FS storage.",
      error
    );
  }

  return Result.ofOk(new FsStorage(baseDirectory));
}
