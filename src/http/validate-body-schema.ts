import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const ValidateBodySchema =
  <TSchema>(schema: ZodType<TSchema>) =>
  async (request: Request, response: Response, next: NextFunction) => {
    const validationResult = await schema.safeParseAsync(request.body);
    if (validationResult.success === true) {
      next();
      return;
    }

    response.status(400).json(validationResult.error);
  };
