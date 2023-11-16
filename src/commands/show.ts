import { GetStorage, StorageDefinition } from "../storage/storage";
import { EmptyResult, Failure } from "../result/result";

export type ShowContainerLogsRequest = {
  containerId: string;
  storageDefinition: StorageDefinition;
};

export async function showContainerLogs(
  getStorage: GetStorage,
  { containerId, storageDefinition }: ShowContainerLogsRequest
): Promise<EmptyResult> {
  const storageResult = await getStorage(storageDefinition);
  if (storageResult instanceof Failure) {
    return storageResult.asEmpty();
  }
  const storage = storageResult.asOk();

  if (!(await storage.isHealthy())) {
    const storageMetadata = storage.getStorageMetadata();
    return EmptyResult.ofFailure(
      `The storage ${storageMetadata.toString()} is unhealthy.`
    );
  }

  const logsResult = await storage.readLogs(containerId);
  if (logsResult instanceof Failure) {
    return logsResult.asEmpty();
  }

  const logs = logsResult.asOk();
  if (!logs) {
    console.log(`Found no logs for container ${containerId}.`);
    return EmptyResult.ofOk();
  }

  logs.pipe(process.stdout);

  return EmptyResult.ofOk();
}
