import { Request, Router } from "express";
import zod from "zod";

import { AuthenticateUser } from "../../../http/authenticate-user";
import { ValidateBodySchema } from "../../../http/validate-body-schema";
import { EmptyFailure, Failure } from "../../../result/result";
import { LogsProcessor } from "../../../logs-processor/logs-processor";
import { Storage } from "../../../storage/storage";

export type ArrangeLogsRequestBody = {
  dockerAddress: string;
  containerFilter: string;
};

interface PostArrangeLogsRequest extends Request {
  body: ArrangeLogsRequestBody;
}

const ARRANGE_LOGS_REQUEST_SCHEMA = zod.object({
  dockerAddress: zod
    .string({
      required_error: "Docker Address is required",
    })
    .url(),
  containerFilter: zod.string({
    required_error: "Container filter is required",
  }),
});

export function getLogsEndpoints(
  logsProcessor: LogsProcessor,
  storage: Storage
) {
  const endpoints = Router();

  endpoints.use(AuthenticateUser("token"));

  endpoints
    .post(
      "/logs/arrange",
      ValidateBodySchema(ARRANGE_LOGS_REQUEST_SCHEMA),
      async (request: PostArrangeLogsRequest, response) => {
        const subscribeResult = await logsProcessor.subscribe(request.body);
        if (subscribeResult instanceof EmptyFailure) {
          console.error(subscribeResult.error, subscribeResult.message);
          response.status(500).json({ error: subscribeResult.message });
          return;
        }

        response.sendStatus(201);
      }
    )
    .get("/logs/{containerId}", async (request: Request, response) => {
      const containerId = request.params["containerId"];
      if (!containerId) {
        response.status(400).json({
          error: "Failed to retrieve containerId from the route params.",
        });
        return;
      }

      const containerLogsResult = await storage.readLogs(containerId);
      if (containerLogsResult instanceof Failure) {
        console.error(containerLogsResult.error, containerLogsResult.message);
        response.status(500).json({ error: containerLogsResult.message });
        return;
      }

      const containerLogs = containerLogsResult.asOk();
      if (!containerLogs) {
        response.status(404);
        return;
      }

      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.setHeader("Transfer-Encoding", "chunked");

      containerLogs.pipe(response);
    });

  return endpoints;
}
