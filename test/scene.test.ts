// import { describe, it } from 'node:test';
process.env['DISABLE_AUTH'] = "true";
import { app, serverPromise, shutDown, startUp} from '../src/server' ;
import * as request from 'supertest';
import {afterAll, beforeAll, describe, it, expect, jest} from '@jest/globals';
import { Server } from 'node:http';

import { MongoMemoryServer } from 'mongodb-memory-server';

let server: Server;
let mongodb: MongoMemoryServer;
beforeAll(done => {
  process.env['DISABLE_AUTH'] = "true";
  // mongo 7 needs wild tiger
  MongoMemoryServer.create({instance: {storageEngine: 'wiredTiger'}}).then(mongo => {
    mongodb = mongo;
    process.env['MONGO_URL'] = mongo.getUri();
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
  shutDown('SIGJEST')
  mongodb.stop();
});

describe("scene", () => {

  it('Should create a default scene', async () => {
    const resp = await request(app).get('/scene');
    expect(resp.statusCode).toBe(200);
    expect(resp.body[0].description).toEqual('default');
  });

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