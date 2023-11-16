import { Readable } from "stream";

import {
  isDockerPresent,
  listActiveContainers,
  listenContainerLogs,
} from "../../docker/docker-wrapper";
import { EmptyResult, Failure } from "../../result/result";
import { GetStorage, Storage, StorageDefinition } from "../../storage/storage";

export type ArrangeContainersLogsRequest = {
  containerFilter: string;
  storageDefinition: StorageDefinition;
};

type SubscribedContainer = {
  logs: Readable;
};

export async function arrangeContainersLogs(
  getStorage: GetStorage,
  { containerFilter, storageDefinition }: ArrangeContainersLogsRequest
): Promise<EmptyResult> {
  const isDockerHealthy = await isDockerPresent();
  if (!isDockerHealthy) {
    return EmptyResult.ofFailure(
      "Docker is not present at the moment. Please get another one."
    );
  }

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

  const subscribedContainers: Map<string, SubscribedContainer> = new Map();
  process.on("SIGTERM", () => gracefullyShutdown(subscribedContainers));
  process.on("SIGINT", () => gracefullyShutdown(subscribedContainers));

  subscribeToContainers(storage, containerFilter, subscribedContainers);
  setInterval(
    () => subscribeToContainers(storage, containerFilter, subscribedContainers),
    5000
  );

  return EmptyResult.ofOk();
}

async function subscribeToContainers(
  storage: Storage,
  containerFilter: string,
  subscribedContainers: Map<string, SubscribedContainer>
): Promise<EmptyResult> {
  const containersResult = await listActiveContainers(containerFilter);
  if (containersResult instanceof Failure) {
    return containersResult.asEmpty();
  }
  const containers = containersResult.asOk();

  const newContainers = containers.filter(
    (container) => !subscribedContainers.has(container.id)
  );

  if (newContainers.length === 0) {
    return EmptyResult.ofOk();
  }

  console.log("Found new containers by filter", newContainers);
  console.table(newContainers);

  for (const container of newContainers) {
    const latestLogsTimestampResult = await storage.getLatestLogTimestamp(
      container.id
    );
    if (latestLogsTimestampResult instanceof Failure) {
      return latestLogsTimestampResult.asEmpty();
    }

    console.log("Reading container", container.id, "logs");
    const containerLogsResult = listenContainerLogs(
      container.id,
      latestLogsTimestampResult.asOk()
    );
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
      } else {
        subscribedContainers.set(container.id, { logs: containerLogs });
      }
    });

    containerLogs.on("finish", () => {
      subscribedContainers.delete(container.id);
      console.log(
        "Unsubscribed from container",
        container.id,
        ".",
        "The stream has been finished."
      );
    });

    containerLogs.on("error", (error) => {
      subscribedContainers.delete(container.id);
      console.log(
        "Unsubscribed from container",
        container.id,
        "because of",
        error
      );
    });
  }

  return EmptyResult.ofOk();
}

function gracefullyShutdown(
  subscribedContainers: Map<string, SubscribedContainer>
) {
  subscribedContainers.forEach((container, containerId) => {
    container.logs.destroy();
    console.log(
      "Container",
      containerId,
      "has been successfully unsubscribed."
    );
  });
  process.exit(0);
}
