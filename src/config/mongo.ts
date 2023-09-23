import { MongoClient, Db } from "mongodb";
import { log } from "../utils/logger";

let _db: Db;

/**
 * This is here so sinon can easily replace the connection string
 */
export function getUrl(): string {
  return process.env.MONGO_URL || 'mongodb://localhost:27017';
}
  
export function connect() {
  const client = new MongoClient(getUrl());
  _db = client.db('ntt');
  return _db;
}

export function getCollection(name: string) {
  return _db.collection(name);
}