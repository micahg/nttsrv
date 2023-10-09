import { Request, Response } from "express";
import { getUser, getOrCreateUser, userExistsOr401 } from "../utils/user";
import { getOrCreateScenes, getSceneById } from "../utils/scene";
import { log } from "../utils/logger";
import { VALID_LAYERS } from "../utils/constants";
import { IScene } from "../models/scene";
import { LayerUpdate, updateAssetFromLink, updateAssetFromUpload } from "../utils/localstore";

export function sceneExistsOr404(scene: IScene) {
  if (!scene) throw new Error('No scene', {cause: 404});
  return scene;
}

export function getScene(req: Request, res: Response, next: any) {
  return getUser(req.auth)
    // do 401 a non-existant user as they don't have access to any scenes
    .then(user => userExistsOr401(user))
    .then(user => getSceneById(req.params.id, user._id.toString()))
    .then(scene => {
      if (scene) return res.status(200).send(scene)
      return res.sendStatus(404);
    })
    .catch(err => next(err));
}

export function getScenes(req: Request, res: Response, next: any) {
  // don't 401 on a non-existant user -- create them (their token has validated)
  return getOrCreateUser(req.auth)
    .then(user => getOrCreateScenes(user))
    .then(scenes => res.status(200).json(scenes))
    .catch(() => next({status: 500}));
}

export function createScene(req: Request, res: Response, next: any) {
  return res.status(501).send('micah todo');
}

export function updateSceneContent(req: Request, res: Response, next: any) {
  return getUser(req.auth)
    .then(user => userExistsOr401(user)) // valid token but no user => 401
    .then(user => getSceneById(req.params.id, user._id.toString()))
    .then(scene => sceneExistsOr404(scene)) // valid  user but no scene => 404
    .then(scene => {
      // ensure valid layer
      if (!('layer' in req.body)) throw new Error('Unspecified layer in asset update request!', {cause: 400});
    
      let layer: string = req.body.layer.toLowerCase();
      if (!VALID_LAYERS.includes(layer)) throw new Error(`Invalid layer name in asset update request: ${layer}`, {cause: 400});

      // if there is an image upload, handle it
      if (req.file) return updateAssetFromUpload(layer, req);
    
      // if there is an image, but its not in file format, assume its a link
      if ('image' in req.body) return updateAssetFromLink(layer, req);

      throw new Error('No file or link in layer update request.', {cause: 406});
    })
    .then((layer: LayerUpdate) => {
      throw new Error(`Need to update ${layer}`, {cause: 406});
    })
    .catch(err => next(err));
}
