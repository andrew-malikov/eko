import createError from "http-errors";
import express, { Express } from "express";
import logger from "morgan";

import { AllowContentTypes } from "./src/http/allow-content-types";
import { Failure, Result } from "./src/result/result";
import { getLogsEndpoints } from "./src/api/v1/log/endpoints";
import { parseStorageDefinition } from "./src/storage/storage";
import { getStorage } from "./src/storage/supported-storage";
import { getDockerApi } from "./src/docker/docker-api";
import { InMemoryLogsProcessor } from "./src/logs-processor/logs-processor";

const STORAGE_DEFINITION = process.env["EKO_STORAGE"];
if (!STORAGE_DEFINITION) {
  throw new Error(
    "Failed to retrieve Storage connection string from EKO_STORAGE ENV"
  );
}

async function serve(storageDefinition: string): Promise<Result<Express>> {
  const storageConfigResult = parseStorageDefinition(storageDefinition);
  if (storageConfigResult instanceof Failure) {
    return storageConfigResult.map();
  }

  const storageResult = await getStorage(storageConfigResult.asOk());
  if (storageResult instanceof Failure) {
    return storageResult.map();
  }
  const storage = storageResult.asOk();

  const logsProcessor = new InMemoryLogsProcessor(5000, storage, getDockerApi);

  const app = express();

  app.use(logger("dev"));
  app.use(AllowContentTypes(["application/json"]));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/api/v1", getLogsEndpoints(logsProcessor, storage));

  app.use((_, __, next) => {
    next(createError(404));
  });

  const port = 3000;
  app.listen(port, () => {
    console.log("Server has started.");
  });

  return Result.ofOk(app);
}

serve(STORAGE_DEFINITION)
  .then((result) => {
    if (result instanceof Failure) {
      console.error(result.error, result.message);
    }
  })
  .catch((reason) => {
    console.error(reason);
  });
