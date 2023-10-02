import { Scene } from "../models/scene";
import { User } from "../models/user";
import { log } from "../utils/logger";
import { Request, Response } from "express";

export function getScenes(req: Request, res: Response, next: any) {
  const sub =req.auth.payload.sub;
  if (!sub) return res.sendStatus(401);
  User.find({sub: sub}).then(user => {
    res.json(user);
  }).catch(err => {
    log.error(err);
    return res.sendStatus(500);
  });
}
export function createScene(req: Request, res: Response, next: any) {
  return res.sendStatus(201);
}