import { NextFunction, Request, Response } from "express";

export const AuthenticateUser =
  (expectedToken: string) =>
  (request: Request, response: Response, next: NextFunction) => {
    const bearer = request.headers.authorization;

    if (!bearer) {
      response.status(401).json({ error: "Authorization header isn't set" });
      return;
    }

    if (expectedToken != bearer.substring(7)) {
      response.status(401).json({ error: "Bearer token is invalid" });
      return;
    }

    next();
  };
