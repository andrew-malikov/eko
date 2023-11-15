import { Command } from "commander";

const cli = new Command();

cli
  .name("eko")
  .description("CLI to arrange and output containers' logs")
  .version("0.0.0");

cli
  .command("arrange")
  .description(
    "listens to a set of containers by tags and stores logs into a storage"
  )
  .argument("<string>", "tags separted by comma")
  .argument("<string>", "a storage layer connection string")
  .action((tags, storageConnectionString) => {
    throw new Error("NOT IMPLEMENTED");
  });

cli.parse();
