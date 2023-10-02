import { log } from "../utils/logger";
import { Schema, model } from 'mongoose';

/**
 * Student Interface.
 * 
 * Each student has a name, Organization ID, and links to a classroom.
 */
interface IScene {
  _id?: Schema.Types.ObjectId,
  user: Schema.Types.ObjectId;
  description: string;
  overlayContent: string;
  userContent: string;
  tableContent: string;
}

const SceneSchema = new Schema<IScene>({
  user:            { type: Schema.Types.ObjectId, required: true,  index: true },
  description:     { type: String,                required: true  },
  overlayContent:  { type: String,                required: false },
  userContent:     { type: String,                required: false },
  tableContent:    { type: String,                required: false },
}, {timestamps: true});

const Scene = model<IScene>('Scene', SceneSchema);

export { Scene, IScene };