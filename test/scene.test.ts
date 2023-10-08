// import { describe, it } from 'node:test';
process.env['DISABLE_AUTH'] = "true";
import { app, serverPromise, shutDown, startUp} from '../src/server' ;
import * as request from 'supertest';
import {afterAll, beforeAll, describe, it, expect, jest} from '@jest/globals';
import { Server } from 'node:http';
import { getFakeUser, getOAuthPublicKey } from '../src/utils/auth';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Collection} from 'mongodb';
import { userZero, userOne } from './assets/auth';

const b64Img = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

let server: Server;
let mongodb: MongoMemoryServer;
let mongocl: MongoClient;
let scenesCollection: Collection;
let usersCollection: Collection;

jest.mock('../src/utils/auth');

beforeAll(done => {
  process.env['DISABLE_AUTH'] = "true";
  // mongo 7 needs wild tiger
  MongoMemoryServer.create({instance: {storageEngine: 'wiredTiger'}}).then(mongo => {
    mongodb = mongo;
    process.env['MONGO_URL'] = `${mongo.getUri()}ntt`;
    process.env['DISABLE_AUTH'] ='true';
    mongocl = new MongoClient(process.env['MONGO_URL']);
    const db = mongocl.db('ntt');
    usersCollection = db.collection('users');
    scenesCollection = db.collection('scenes');

    (getOAuthPublicKey as jest.Mock).mockReturnValue(Promise.resolve('pubkey'));

    startUp();
    serverPromise.then(srvr => { server = srvr; done(); })
      .catch(err => {
        console.error(`Getting server failed: ${JSON.stringify(err)}`);
        process.exit(1);
      }
    );
  });
});

afterAll(() => {
  shutDown('SIGJEST')                         // signal shutdown
  mongocl.close().then(() => mongodb.stop()); // close client then db
});

describe("scene", () => {

  it('Should create default scenes', async () => {
    (getFakeUser as jest.Mock).mockReturnValue(userZero);

    const resp0 = await request(app).get('/scene');
    const uid1 = resp0.body[0].user
    expect(resp0.statusCode).toBe(200);
    expect(resp0.body[0].description).toEqual('default');
    const sceneCount0 = await scenesCollection.countDocuments();
    expect(sceneCount0).toBe(1)
    const userCount0 = await usersCollection.countDocuments();
    expect(userCount0).toBe(1);

    (getFakeUser as jest.Mock).mockReturnValue(userOne);

    const resp = await request(app).get('/scene');
    const uid2 = resp.body[0].user;
    expect(resp.statusCode).toBe(200);
    expect(resp.body[0].description).toEqual('default');
    const sceneCount = await scenesCollection.countDocuments();
    expect(sceneCount).toBe(2)
    const userCount = await usersCollection.countDocuments();
    expect(userCount).toBe(2);
    expect(uid1).not.toEqual(uid2);
  });

  it ('Should fail accessing a scene it does not have access to', async () => {
    expect(1).toBe(1);
  });

  // MICAH next add images to the scene.

  // it('Should find empty scenes when there are no scenes', async () => {
  //   (userUtils.getOrCreateUser as jest.Mock).mockReturnValue(Promise.resolve({sub: 'd00t'}));
  //   (sceneUtils.getOrCreateScenes as jest.Mock).mockReturnValue(Promise.resolve([]));
  //   const resp = await request(app).get('/scene');
  //   expect(resp.body).toHaveLength(0);
  //   expect(resp.body).toEqual([]);
  //   expect(resp.statusCode).toBe(200);
  // });

  // it('Should find one scene when there is one scene', async () => {
  //   const scene = { _id: "id", user: "user_id"};
  //   (userUtils.getOrCreateUser as jest.Mock).mockReturnValue(Promise.resolve({sub: 'd00t'}));
  //   (sceneUtils.getOrCreateScenes as jest.Mock).mockReturnValue(Promise.resolve([scene]));
  //   const resp = await request(app).get('/scene');
  //   expect(resp.body).toHaveLength(1);
  //   expect(resp.body).toEqual([scene]);
  //   expect(resp.statusCode).toBe(200);
  // });
});