import { exec } from "child_process";

import { Result } from "../result/result";

export type Container = {
  name: string;
  id: string;
};

// TODO: sanitize the label arg
/**
 * @param filter a docker container ls filter
 */
export function listContainers(filter: string): Promise<Result<Container[]>> {
  return new Promise<Result<Container[]>>((resolve, reject) => {
    exec(
      `docker container ls -a --format json -f ${filter}`,
      (error, stdout, _) => {
        if (error) {
          return Promise.resolve(
            Result.ofFailure(
              `Failed to gather containers from docker deamon with fitler ${filter}.`,
              error
            )
          );
        }

        const jsonRows = stdout.split("\n");

        try {
          const containers = jsonRows
            .map((container) => JSON.parse(container))
            .map((container: { [key: string]: unknown }) => {
              const id = container["id"];
              if (typeof id != "string") {
                throw new Error(`Invalid container id ${id}`);
              }

              const name = container["name"];
              if (typeof name != "string") {
                throw new Error(`Invalid container name ${name}`);
              }

              return { id, name };
            });

          return Result.ofOk(containers);
        } catch (error) {
          return Result.ofFailure(
            `Failed to parse container list from docker deamon. ${stdout}`,
            error
          );
        }
      }
    );
  });
}
