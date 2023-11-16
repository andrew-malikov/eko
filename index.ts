import { Command } from "commander";

import {
  SUPPORTED_STORAGE_METADATA as SUPPORTED_STORAGE_METADATA,
  getStorage,
} from "./src/storage/supported-storage";
import { arrangeContainersLogs } from "./src/commands/log/arrange";
import { Failure } from "./src/result/result";
import { parseStorageDefinition } from "./src/storage/storage";
import { showContainerLogs } from "./src/commands/log/show";
import { listContainers } from "./src/commands/log/list";
import { getDockerWrapper } from "./src/docker/docker-wrapper";

const cli = new Command();

cli
  .name("eko")
  .description("CLI to arrange and output containers' logs")
  .version("0.0.0");

const storageCli = cli.command("storage").description("manages storage layers");

storageCli
  .command("list")
  .description("lists all storage layers")
  .action(() => {
    console.table(SUPPORTED_STORAGE_METADATA);
  });

const logsCli = cli.command("log").description("manages logs");

logsCli
  .command("arrange")
  .description(
    "listens to a filtered set of containers and stores logs into a storage"
  )
  .option("-s, --s <storage>", "storage layer", "fs::./logs")
  .option(
    "-d, --d <docker>",
    "docker connection string like 'local::/var/run/docker.sock' or 'remote::214.12.124.12:3000'",
    "local::/var/run/docker.sock"
  )
  .argument(
    "<filter>",
    "container filter like in `docker container ls -f label=xyz`"
  )
  .action(async (filter, options) => {
    const storageConfigOption = options["s"];
    if (!storageConfigOption) {
      console.error(
        "No -s option is specified or default one is overriden to nothing"
      );
      process.exit(1);
    }

    if (typeof storageConfigOption != "string") {
      console.error("Storage layer options -s must be a string");
      process.exit(1);
    }

    const storageConfigResult = parseStorageDefinition(storageConfigOption);
    if (storageConfigResult instanceof Failure) {
      console.error(storageConfigResult.message, storageConfigResult.error);
      process.exit(1);
    }

    const dockerConfigOption = options["d"];
    if (!dockerConfigOption) {
      console.error(
        "No -d option is specified or default one is override to nothing"
      );
      process.exit(1);
    }

    if (typeof dockerConfigOption != "string") {
      console.error("Docker connection options -d must be a string");
      process.exit(1);
    }

    const dockerResult = getDockerWrapper(dockerConfigOption);
    if (dockerResult instanceof Failure) {
      console.error(dockerResult.message, dockerResult.error);
      process.exit(1);
    }

    const arrangeResult = await arrangeContainersLogs(
      getStorage,
      dockerResult.asOk(),
      {
        containerFilter: filter,
        storageDefinition: storageConfigResult.asOk(),
      }
    );

    if (arrangeResult instanceof Failure) {
      console.error(arrangeResult.message, arrangeResult.error);
      process.exit(1);
    }
  });

logsCli
  .command("list")
  .description("list logged containers")
  .option("-s, --s <storage>", "storage layer", "fs::./logs")
  .action(async (options) => {
    const storageConfigOption = options["s"];
    if (!storageConfigOption) {
      console.error(
        "No -s option is specified or default one is overriden to nothing"
      );
      process.exit(1);
    }

    if (typeof storageConfigOption != "string") {
      console.error("Storage layer options -s must be a string");
      process.exit(1);
    }

    const storageConfigResult = parseStorageDefinition(storageConfigOption);
    if (storageConfigResult instanceof Failure) {
      console.error(storageConfigResult.message, storageConfigResult.error);
      process.exit(1);
    }

    const listContainersResult = await listContainers(getStorage, {
      storageDefinition: storageConfigResult.asOk(),
    });

    if (listContainersResult instanceof Failure) {
      console.error(listContainersResult.message, listContainersResult.error);
      process.exit(1);
    }
  });

logsCli
  .command("show")
  .description("prints container logs into stdout")
  .option("-s, --s <storage>", "storage layer", "fs::./logs")
  .argument("<containerId>", "container id")
  .action(async (containerId, options) => {
    const storageConfigOption = options["s"];
    if (!storageConfigOption) {
      console.error(
        "No -s option is specified or default one is overriden to nothing"
      );
      process.exit(1);
    }

    if (typeof storageConfigOption != "string") {
      console.error("Storage layer options -s must be a string");
      process.exit(1);
    }

    const storageConfigResult = parseStorageDefinition(storageConfigOption);
    if (storageConfigResult instanceof Failure) {
      console.error(storageConfigResult.message, storageConfigResult.error);
      process.exit(1);
    }

    const showResult = await showContainerLogs(getStorage, {
      containerId,
      storageDefinition: storageConfigResult.asOk(),
    });

    if (showResult instanceof Failure) {
      console.error(showResult.message, showResult.error);
      process.exit(1);
    }
  });

cli.parse();
