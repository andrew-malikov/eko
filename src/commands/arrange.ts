import { getFsStorage } from "../storage-layers/fs-storage";
import {
  listActiveContainers,
  listenContainerLogs,
} from "../docker/docker-wrapper";
import { EmptyResult, Failure } from "../result/result";
import { StorageConfig } from "../storage/storage";

export type ArrangeContainersLogsRequest = {
  containerFilter: string;
  storageConfig: StorageConfig;
};

export async function arrangeContainersLogs({
  containerFilter,
  storageConfig,
}: ArrangeContainersLogsRequest): Promise<EmptyResult> {
  const storageResult = await getFsStorage(storageConfig.config as string);
  if (storageResult instanceof Failure) {
    return storageResult.asEmpty();
  }
  const storage = storageResult.asOk();

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

    const saveResult = await storage.saveLogs(container.id, containerLogs);
    if (saveResult instanceof Failure) {
      console.error(
        "Failed to start saving logs of container",
        container.id,
        saveResult.message,
        saveResult.error
      );
    }
  }

  return EmptyResult.ofFailure("Not Implemented");
}
