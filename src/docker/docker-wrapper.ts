import { exec } from "child_process";

import { Result } from "../result/result";
import { Option } from "../result/option";
import { Readable, Stream } from "stream";

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

export function listenContainerLogs(
  containerId: string,
  timestamp: Option<number> = null
): Result<Readable> {
  let logCommand = `docker logs ${containerId} -t --follow`;
  if (timestamp) {
    logCommand += ` --since (${timestamp} - 1ms)`;
  }

  const containerLogs = exec(logCommand);

  if (!containerLogs.stdout) {
    return Result.ofFailure("Failed to acquire logs' stream.");
  }

  return Result.ofOk(containerLogs.stdout);
}

export async function isDockerPresent(): Promise<boolean> {
  return new Promise<boolean>((resolve, _) => {
    exec("docker", (error, _, __) => {
      error ? resolve(false) : resolve(true);
    });
  });
}
