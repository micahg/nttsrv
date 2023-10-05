// import { describe, it } from 'node:test';
process.env['DISABLE_AUTH'] = "true";
import { app, serverPromise, shutDown, startUp} from '../src/server' ;
import * as goose from '../src/config/mongoose';
import * as request from 'supertest';
import {afterAll, beforeAll, describe, it, expect, jest} from '@jest/globals';
import { Server } from 'node:http';

import * as userUtils from "../src/utils/user";
import * as sceneUtils from "../src/utils/scene";
import { IScene } from '../src/models/scene';
import { Schema } from 'mongoose';
import { resolve } from 'node:path';

jest.mock("../src/config/mongoose");
jest.mock("../src/utils/user");
jest.mock("../src/utils/scene");

let server: Server;
beforeAll(done => {
  process.env['DISABLE_AUTH'] = "true";
  (goose.connect as jest.Mock).mockReturnValue(Promise.resolve(null));
  startUp();
  serverPromise.then(srvr => { server = srvr; done(); })
    .catch(err => {
      console.error(`Getting server failed: ${JSON.stringify(err)}`);
      process.exit(1);
    }
  );
});

afterAll(() => {
  shutDown('SIGJEST');
});

describe("scene", () => {

  it('Should 500 on a user error', async () => {
    jest.spyOn(userUtils, 'getOrCreateUser').mockImplementation(async () => Promise.reject('nope'));
    const resp = await request(app).get('/scene');
    expect(resp.statusCode).toBe(500);
  });

  it('Should find empty scenes when there are no scenes', async () => {
    (userUtils.getOrCreateUser as jest.Mock).mockReturnValue(Promise.resolve({sub: 'd00t'}));
    (sceneUtils.getScenesByUser as jest.Mock).mockReturnValue(Promise.resolve([]));
    const resp = await request(app).get('/scene');
    expect(resp.body).toHaveLength(0);
    expect(resp.body).toEqual([]);
    expect(resp.statusCode).toBe(200);
  });

  it('Should find one scene when there is one scene', async () => {
    const scene = { _id: "id", user: "user_id"};
    (userUtils.getOrCreateUser as jest.Mock).mockReturnValue(Promise.resolve({sub: 'd00t'}));
    (sceneUtils.getScenesByUser as jest.Mock).mockReturnValue(Promise.resolve([scene]));
    const resp = await request(app).get('/scene');
    expect(resp.body).toHaveLength(1);
    expect(resp.body).toEqual([scene]);
    expect(resp.statusCode).toBe(200);
  });
});