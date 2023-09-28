// import { MongoClient, Db } from "mongodb";
import { log } from "../utils/logger";
import mongoose, { Mongoose } from "mongoose";

// let _db: Db;

/**
 * This is here so sinon can easily replace the connection string
 */
export function getUrl(): string {
  return process.env.MONGO_URL || 'mongodb://localhost:27017';
}
  
export function connect(): Promise<Mongoose> {
  const options = {
    serverSelectionTimeoutMS: 5000,
  };
  return mongoose.connect(getUrl(), options);
}