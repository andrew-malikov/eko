import { EmptyResult, Failure } from "../../result/result";
import { GetStorage, StorageDefinition } from "../../storage/storage";

export type ListContainersRequest = {
  storageDefinition: StorageDefinition;
};

export async function listContainers(
  getStorage: GetStorage,
  { storageDefinition }: ListContainersRequest
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

  const containersResult = await storage.getLoggedContainers();
  if (containersResult instanceof Failure) {
    return containersResult.asEmpty();
  }

  console.log("Found containers' ids", containersResult.asOk());

  await storage.destory();

  return EmptyResult.ofOk();
}
