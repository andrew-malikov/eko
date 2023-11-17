import Docker from "dockerode";

import { Option } from "../result/option";
import { Result } from "../result/result";

export interface DockerApi {
  listActiveContainers(filter: string): Promise<Result<Container[]>>;
  listenContainerLogs(
    containerId: string,
    timestamp: Option<number>
  ): Promise<Result<NodeJS.ReadableStream>>;
  isHealthy(): Promise<boolean>;
}

const DOCKER_CONNECTION_EXPRESSION = "([a-zA-Z]+)::(.+)";

export function getDockerWrapper(connection: string): Result<DockerApi> {
  const connectionParts = connection.match(DOCKER_CONNECTION_EXPRESSION);
  if (!connectionParts) {
    return Result.ofFailure(`Failed to parse docker connection ${connection}.`);
  }

  if (connectionParts.length !== 3) {
    return Result.ofFailure(`Failed to parse docker connection ${connection}.`);
  }

  try {
    switch (connectionParts[1]) {
      case "local":
        return Result.ofOk(
          new DockerWrapper(new Docker({ socketPath: connectionParts[2] }))
        );
      case "remote":
        return Result.ofOk(
          new DockerWrapper(new Docker({ host: connectionParts[2] }))
        );
    }

    return Result.ofFailure(
      "Failed to identify docker connection type. It should be 'local::/path/var/docker.sock' or 'remote::183.12.13.1:2391'"
    );
  } catch (error) {
    return Result.ofFailure(
      `Failed to connect to docker deamon with connection ${connection}.`,
      error
    );
  }
}

export class DockerWrapper implements DockerApi {
  constructor(private readonly docker: Docker) {}

  async listActiveContainers(filter: string): Promise<Result<Container[]>> {
    try {
      const filters = filter
        .split(" ")
        .map((pair) => pair.split("="))
        .filter((pair) => pair.length == 2)
        .reduce((acc, pair) => {
          (acc as any)[pair[0]] = [pair[1]];
          return acc;
        }, {});

      const containers = await this.docker.listContainers({
        filters,
      });
      return Result.ofOk(
        containers.map((container) => ({
          id: container.Id,
          name: container.Names.join(),
        }))
      );
    } catch (error) {
      return Result.ofFailure(
        `Failed to gather containers from docker deamon with fitler ${filter}.`,
        error
      );
    }
  }

  async listenContainerLogs(
    containerId: string,
    timestamp: Option<number>
  ): Promise<Result<NodeJS.ReadableStream>> {
    const options = timestamp ? { since: timestamp - 1 } : {};

    try {
      const logs = await this.docker.getContainer(containerId).logs({
        follow: true,
        timestamps: true,
        stdout: true,
        ...options,
      });

      return Result.ofOk(logs);
    } catch (error) {
      return Result.ofFailure(
        `Failed to listen to logs from container ${containerId}.`,
        error
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }
}

export type Container = {
  name: string;
  id: string;
};
