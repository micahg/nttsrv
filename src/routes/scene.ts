import { Request, Response } from "express";
import { getOrCreateUser } from "../utils/user";
import { getOrCreateScenes } from "../utils/scene";

export function getScenes(req: Request, res: Response, next: any) {
  return getOrCreateUser(req.auth)
    .then(user => getOrCreateScenes(user))
    .then(scenes => res.status(200).json(scenes))
    .catch(() => next({status: 500}));
}
export function createScene(req: Request, res: Response, next: any) {
  return res.sendStatus(201);
}