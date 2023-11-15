import { listContainers } from "../docker/docker-wrapper";
import { EmptyResult, Failure } from "../result/result";
import { StorageLayerType } from "../storage/storage";

export type ArrangeContainersLogsRequest = {
  containerFilter: string;
  storage: StorageLayerType;
};

export async function arrangeContainersLogs({
  containerFilter,
}: ArrangeContainersLogsRequest): Promise<EmptyResult> {
  const containersResult = await listContainers(containerFilter);
  if (containersResult instanceof Failure) {
    return containersResult;
  }

  console.table(containersResult.asOk());

  return EmptyResult.ofFailure("Not Implemented");
}
