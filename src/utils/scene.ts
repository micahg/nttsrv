import { listen } from "../config/express";
import { IScene, Scene } from "../models/scene";
import { IUser } from "../models/user";

export function getScenesByUser(user: IUser): Promise<IScene[]> {
  return Scene.find({user: user._id})
}

export function createDefaultScene(user: IUser): Promise<IScene> {
  const scene: IScene = {
    user: user._id,
    description: 'default',
  }
  return Scene.create(scene);
}

/**
 * Get the scenes for this user, create a default scene if they have none.
 *
 * @todo consider the campaign
 * @param user The user for which to get/create scenes.
 * @returns A promise returning a list of scenes
 */
export function getOrCreateScenes(user: IUser): Promise<IScene[]> {
  return new Promise((resolve) => {
    getScenesByUser(user)
      .then(scenes => {
        if (scenes.length > 0) return resolve(scenes);
        return createDefaultScene(user).then(newScene => resolve([newScene]));
      });
  });
}