import { Request, Router } from "express";
import zod from "zod";

import { AuthenticateUser } from "../../../http/authenticate-user";
import { ValidateBodySchema } from "../../../http/validate-body-schema";
import { EmptyFailure } from "../../../result/result";
import { LogsProcessor } from "../../../logs-processor/logs-processor";

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

export function getLogsEndpoints(logsProcessor: LogsProcessor) {
  const endpoints = Router();

  endpoints.use(AuthenticateUser("token"));

  endpoints
    .route("/logs/arrange")
    .post(
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
    );

  return endpoints;
}
