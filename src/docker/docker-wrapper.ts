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
export function listActiveContainers(
  filter: string
): Promise<Result<Container[]>> {
  return new Promise<Result<Container[]>>((resolve, _) => {
    exec(
      `docker container ls --format json -f ${filter}`,
      (error, stdout, _) => {
        if (error) {
          return resolve(
            Result.ofFailure(
              `Failed to gather containers from docker deamon with fitler ${filter}.`,
              error
            )
          );
        }

        const jsonRows = stdout.split("\n");
        try {
          const containers = jsonRows
            .filter((container) => container.trim().length != 0)
            .map((container) => JSON.parse(container))
            .map((container: { [key: string]: unknown }) => {
              const id = container["ID"];
              if (typeof id != "string") {
                throw new Error(`Invalid container id ${id}`);
              }

              const name = container["Names"];
              if (typeof name != "string") {
                throw new Error(`Invalid container name ${name}`);
              }

              return { id, name };
            });

          resolve(Result.ofOk(containers));
        } catch (error) {
          resolve(
            Result.ofFailure(
              `Failed to parse container list from docker deamon. ${stdout}`,
              error
            )
          );
        }
      }
    );
  });
}
