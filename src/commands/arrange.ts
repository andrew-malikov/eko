import {
  listActiveContainers,
  listenContainerLogs,
} from "../docker/docker-wrapper";
import { EmptyResult, Failure } from "../result/result";
import { StorageLayerType } from "../storage/storage";

export type ArrangeContainersLogsRequest = {
  containerFilter: string;
  storage: StorageLayerType;
};

export async function arrangeContainersLogs({
  containerFilter,
}: ArrangeContainersLogsRequest): Promise<EmptyResult> {
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

  const container = containers[0];
  const containerLogsResult = listenContainerLogs(container.id);
  if (containerLogsResult instanceof Failure) {
    return containerLogsResult.asEmpty();
  }

  console.log("Reading container", container.id, "logs");
  containerLogsResult.asOk().pipe(process.stdout);

  return EmptyResult.ofFailure("Not Implemented");
}
