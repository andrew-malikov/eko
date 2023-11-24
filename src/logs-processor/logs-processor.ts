import { DockerApi } from "../docker/docker-api";
import { Option } from "../result/option";
import { EmptyResult, Failure, Result } from "../result/result";
import { Storage } from "../storage/storage";

export type ArrangeLogsRequest = {
  dockerAddress: string;
  containerFilter: string;
};

export interface LogsProcessor {
  // TODO: return uuid as a subcription id to cancel later if needed
  subscribe(request: ArrangeLogsRequest): EmptyResult;
  unsubscribe(request: ArrangeLogsRequest): Promise<EmptyResult>;
  // TODO: add getSubscriptions(): Promise<string[]>; to manage subs later
  //       and maybe not just ids but whole objects so far
  destroy(): void;
}

export type GetDockerApi = (dockerSocketAddress: string) => Result<DockerApi>;

type SubscribedDockerSocket = {
  queries: {
    containerFilter: string;
  }[];
  api: DockerApi;
  containers: Map<string, { logs: NodeJS.ReadableStream }>;
  // TODO: add lastCheck: Date to use later as skip indicator
};

export class InMemoryLogsProcessor implements LogsProcessor {
  private observationIntervalId: Option<NodeJS.Timeout>;
  private readonly subscriptions: Map<string, SubscribedDockerSocket> =
    new Map();

  constructor(
    private readonly observationInterval: number,
    private readonly storage: Storage,
    private readonly dockerFactory: GetDockerApi
  ) {}

  subscribe({
    dockerAddress: dockerSockerAddress,
    containerFilter,
  }: ArrangeLogsRequest): EmptyResult {
    if (!this.observationIntervalId) {
      this.observationIntervalId = setInterval(() => {},
      this.observationInterval);
    }

    const dockerSubscription = this.subscriptions.get(dockerSockerAddress);
    if (!dockerSubscription) {
      const dockerResult = this.dockerFactory(dockerSockerAddress);
      if (dockerResult instanceof Failure) {
        return dockerResult.asEmpty();
      }

      this.subscriptions.set(dockerSockerAddress, {
        queries: [{ containerFilter }],
        api: dockerResult.asOk(),
        containers: new Map(),
      });

      return EmptyResult.ofOk();
    }

    const subscribedQuery = dockerSubscription.queries.find(
      (query) => query.containerFilter === containerFilter
    );
    if (!subscribedQuery) {
      dockerSubscription.queries.push({ containerFilter });
    }

    return EmptyResult.ofOk();
  }

  private async observeContainers(): Promise<void> {
    for (const [dockerAddress, docker] of this.subscriptions) {
      const isDockerInstanceHealthyResult = await docker.api.isHealthy();
      if (!isDockerInstanceHealthyResult) {
        console.log(
          dockerAddress,
          "is unhealthy at the moment, observation is skipped."
        );
        continue;
      }

      const isStorageHealthy = await this.storage.isHealthy();
      if (!isStorageHealthy) {
        console.log(
          "Storage",
          this.storage.getStorageMetadata(),
          "is unhealthy at the moment, observation is skipped for",
          dockerAddress,
          "."
        );
        continue;
      }

      for (const { containerFilter } of docker.queries) {
        const containersResult = await docker.api.listActiveContainers(
          containerFilter
        );
        if (containersResult instanceof Failure) {
          continue;
        }
        const containers = containersResult.asOk();

        const newContainers = containers.filter(
          (container) => !docker.containers.has(container.id)
        );

        for (const container of newContainers) {
          const latestLogsTimestampResult =
            await this.storage.getLatestLogTimestamp(container.id);
          if (latestLogsTimestampResult instanceof Failure) {
            continue;
          }

          const containerLogsResult = await docker.api.listenContainerLogs(
            container.id,
            latestLogsTimestampResult.asOk()
          );
          if (containerLogsResult instanceof Failure) {
            continue;
          }
          const containerLogs = containerLogsResult.asOk();

          this.storage
            .saveLogs(container.id, containerLogs)
            .then((saveResult) => {
              if (!(saveResult instanceof Failure)) {
                docker.containers.set(container.id, { logs: containerLogs });
              }
            });

          containerLogs.on("finish", () => {
            docker.containers.delete(container.id);
          });

          containerLogs.on("error", (error) => {
            docker.containers.delete(container.id);
          });
        }
      }
    }
  }

  unsubscribe(request: ArrangeLogsRequest): Promise<EmptyResult> {
    throw new Error("Method not implemented.");
  }

  destroy(): void {
    throw new Error("Method not implemented.");
  }
}
