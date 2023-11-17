import { PassThrough, Stream } from "stream";

import { Option } from "../../result/option";
import { EmptyResult, Result } from "../../result/result";
import { Storage, StorageMetadata } from "../storage";
import { Db, MongoClient, ObjectId } from "mongodb";

export class MongoStorage implements Storage {
  constructor(
    private db: Db,
    private client: MongoClient,
    private connectionString: string
  ) {}

  getStorageMetadata(): StorageMetadata {
    return {
      name: "mongo",
      connectionString: this.connectionString,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async getLoggedContainers(): Promise<Result<string[]>> {
    try {
      const mongoContainers = await this.db
        .collection("logs")
        .find()
        .project({})
        .toArray();
      return Result.ofOk(mongoContainers.map((c) => c._id.toString()));
    } catch (error) {
      return Result.ofFailure(
        "Failed to retrieve logged containers list.",
        error
      );
    }
  }

  async saveLogs(
    containerId: string,
    logs: NodeJS.ReadableStream
  ): Promise<EmptyResult> {
    try {
      const collection = this.db.collection("containers");

      let chunks: string[] = [];

      logs.on("data", (chunk: Buffer) => {
        chunks.push(chunk.toString("utf-8"));

        if (chunks.length > 25) {
          collection.updateOne(
            { _id: containerIdToMongoId(containerId) },
            { $push: { logs: { $each: chunks } } },
            { upsert: true }
          );
          chunks = [];
        }
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
      const collection = this.db.collection("containers");

      const foundContainerDocument = await collection.countDocuments({
        _id: containerIdToMongoId(containerId),
      });

      if (foundContainerDocument === 0) {
        return Result.ofOk(null);
      }

      const logsCursor = await collection.findOne(
        {
          _id: containerIdToMongoId(containerId),
        },
        {
          projection: { logs: 1 },
        }
      );

      if (!logsCursor) {
        return Result.ofOk(null);
      }

      const stream = new PassThrough();
      (logsCursor.logs as string[]).forEach((log) => {
        stream.push(log);
      });

      return Result.ofOk(stream);
    } catch (error) {
      return Result.ofFailure("Failed to retrieve container logs", error);
    }
  }

  async getLatestLogTimestamp(
    containerId: string
  ): Promise<Result<Option<number>>> {
    try {
      const collection = this.db.collection("containers");

      const foundContainerDocument = await collection.countDocuments({
        _id: containerIdToMongoId(containerId),
      });

      if (foundContainerDocument === 0) {
        return Result.ofOk(null);
      }

      const containerDocument = await collection.findOne(
        {
          _id: containerIdToMongoId(containerId),
        },
        {
          sort: { _id: -1 },
          projection: { logs: { $slice: -1 } },
        }
      );

      if (!containerDocument || !containerDocument.logs.length) {
        return Result.ofOk(null);
      }

      const logSegments = containerDocument.logs[0].split(" ");
      if (logSegments.length < 2) {
        return Result.ofOk(null);
      }

      try {
        const unixTimestamp = Date.parse(logSegments[0]);
        return Result.ofOk(unixTimestamp);
      } catch {
        return Result.ofOk(null);
      }
    } catch (error) {
      return Result.ofFailure(
        "Failed to retrieve latest container log timestamp",
        error
      );
    }
  }

  destory(): Promise<void> {
    return this.client.close();
  }
}

export async function getMongoStorage(
  connectionString: string
): Promise<Result<Storage>> {
  try {
    const mongoClient = await MongoClient.connect(connectionString);
    const mongoDb = mongoClient.db();
    return Result.ofOk(
      new MongoStorage(mongoDb, mongoClient, connectionString)
    );
  } catch (error) {
    return Result.ofFailure("Failed to connect to Mongo DB storage.", error);
  }
}

function containerIdToMongoId(containerId: string): ObjectId {
  return new ObjectId(containerId.slice(0, 24));
}
