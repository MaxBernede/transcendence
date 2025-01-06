import { Request, Response } from 'express';

export interface IAppContext {
  req: Request;
  res: Response;
}

export interface IAuthMiddlewareContext {
  req: Request;
  res: Response;
  auth: {
    userId: string;
    username: string;
  };
}
