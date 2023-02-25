import { Request, Response } from "express";

export function updateState(req: Request, res: Response, next: any) {
  return res.sendStatus(200);
}