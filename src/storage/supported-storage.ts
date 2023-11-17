import { Result } from "../result/result";
import { getFsStorage } from "./layers/fs-storage";
import { getMongoStorage } from "./layers/mongo-storage";
import { Storage, StorageDefinition } from "./storage";

export const SUPPORTED_STORAGE_METADATA = [
  {
    name: "fs",
    description: "File System",
    connectionString: "fs::/folder/where/to/save",
    example: "fs::./logs",
  },
  {
    name: "mongo",
    description: "MongoDB",
    connectionString: "mongo::mongodb://localhost:27017/logs",
  },
];

const SUPPORTED_STORAGE: {
  [key: string]: (connectionString: string) => Promise<Result<Storage>>;
} = {
  fs: getFsStorage,
  mongo: getMongoStorage,
};

export async function getStorage(
  definition: StorageDefinition
): Promise<Result<Storage>> {
  const storageFactory = SUPPORTED_STORAGE[definition.name];
  if (!storageFactory) {
    return Result.ofFailure(
      `Failed to find supported storage by name ${definition.name}.`
    );
  }

  return await storageFactory(definition.connectionString);
}
