import {
  listActiveContainers,
  listenContainerLogs,
} from "../docker/docker-wrapper";
import { EmptyResult, Failure, Result } from "../result/result";
import { GetStorage, StorageDefinition } from "../storage/storage";

export type ArrangeContainersLogsRequest = {
  containerFilter: string;
  storageDefinition: StorageDefinition;
};

export async function arrangeContainersLogs(
  getStorage: GetStorage,
  { containerFilter, storageDefinition }: ArrangeContainersLogsRequest
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

  const containersResult = await listActiveContainers(containerFilter);
  if (containersResult instanceof Failure) {
    return containersResult.asEmpty();
  }
  const containers = containersResult.asOk();

  console.log("Found containers by filter", containerFilter);
  console.table(containers);

  if (containers.length === 0) {
    return EmptyResult.ofOk();
  }

  for (const container of containers) {
    console.log("Reading container", container.id, "logs");
    const containerLogsResult = listenContainerLogs(container.id);
    if (containerLogsResult instanceof Failure) {
      return containerLogsResult.asEmpty();
    }
    const containerLogs = containerLogsResult.asOk();

    storage.saveLogs(container.id, containerLogs).then((saveResult) => {
      if (saveResult instanceof Failure) {
        console.error(
          "Failed to start saving logs of container",
          container.id,
          saveResult.message,
          saveResult.error
        );
      }
    });
  }

  return EmptyResult.ofOk();
}
