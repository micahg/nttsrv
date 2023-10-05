import { Scene } from "../models/scene";
import { IUser } from "../models/user";

export function getScenesByUser(user: IUser) {
  return Scene.find({user: user._id})
}