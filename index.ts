import { Command } from "commander";

import { SUPPORTED_STORAGES } from "./src/storage-layers/supported-storages";
import { arrangeContainersLogs } from "./src/commands/arrange";
import { Failure } from "./src/result/result";

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
    console.table(SUPPORTED_STORAGES);
  });

cli
  .command("arrange")
  .description(
    "listens to a set of containers by tags and stores logs into a storage"
  )
  .option("-s, --s", "storage layer", "fs::")
  .argument(
    "<filter>",
    "container filter like in `docker container ls -f label=xyz`"
  )
  .action(async (filter, _) => {
    const arrangeResult = await arrangeContainersLogs({
      containerFilter: filter,
      storage: {} as any,
    });

    if (arrangeResult instanceof Failure) {
      console.error(arrangeResult.message, arrangeResult.error);
      process.exit(1);
    }
  });

cli.parse();
