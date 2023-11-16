import { Result } from "../result/result";
import { getFsStorage } from "./layers/fs-storage";
import { Storage, StorageDefinition } from "./storage";

export const SUPPORTED_STORAGES_METADATA = [
  {
    name: "fs",
    description: "File System",
    connectionString: "fs::/folder/where/to/save",
    example: "fs::./logs",
  },
];

const SUPPORTED_STORAGES: {
  [key: string]: (connectionString: string) => Promise<Result<Storage>>;
} = {
  fs: getFsStorage,
};

export async function getStorage(
  definition: StorageDefinition
): Promise<Result<Storage>> {
  const storageFactory = SUPPORTED_STORAGES[definition.name];
  if (!storageFactory) {
    return Result.ofFailure(
      `Failed to find supported storage by name ${definition.name}.`
    );
  }

  return await storageFactory(definition.connectionString);
}
