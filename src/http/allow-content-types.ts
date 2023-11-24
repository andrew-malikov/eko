import { NextFunction, Request, Response } from "express";

export const AllowContentTypes =
  (allowedContentTypes: string[]) =>
  (request: Request, response: Response, next: NextFunction) => {
    const contentType = request.headers["content-type"];
    if (!contentType) {
      response.status(400).json({ error: "Content-Type header is missing" });
      return;
    }

    if (!allowedContentTypes.includes(contentType)) {
      response.status(400).json({
        error: `Content-Type ${contentType} isn't supported. Please use one of ${allowedContentTypes}`,
      });
      return;
    }

    next();
  };
