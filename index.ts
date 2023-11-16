import { Command } from "commander";

import {
  SUPPORTED_STORAGES_METADATA,
  getStorage,
} from "./src/storage/supported-storages";
import { arrangeContainersLogs } from "./src/commands/arrange";
import { Failure } from "./src/result/result";
import { parseStorageDefinition } from "./src/storage/storage";
import { showContainerLogs } from "./src/commands/show";

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
    console.table(SUPPORTED_STORAGES_METADATA);
  });

const logsCli = cli.command("logs").description("manages logs");

logsCli
  .command("arrange")
  .description(
    "listens to a set of containers by tags and stores logs into a storage"
  )
  .option("-s, --s", "storage layer", "fs::./logs")
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

    const storageConfigResult = parseStorageDefinition(storageConfigOption);
    if (storageConfigResult instanceof Failure) {
      console.error(storageConfigResult.message, storageConfigResult.error);
      process.exit(1);
    }

    const arrangeResult = await arrangeContainersLogs(getStorage, {
      containerFilter: filter,
      storageDefinition: storageConfigResult.asOk(),
    });

    if (arrangeResult instanceof Failure) {
      console.error(arrangeResult.message, arrangeResult.error);
      process.exit(1);
    }
  });

logsCli
  .command("show")
  .description("prints container logs into stdout")
  .option("-s, --s", "storage layer", "fs::./logs")
  .argument("<containerId>", "container id")
  .action(async (containerId, options) => {
    const storageConfigOption = options["s"];
    if (!storageConfigOption) {
      console.error(
        "No -s option is specified or default one is overriden to nothing"
      );
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
