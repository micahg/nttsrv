// import { describe, it } from 'node:test';
import { app, serverPromise, shutDown} from '../src/server' ;
import * as request from 'supertest';
import {afterAll, beforeAll, describe, it, expect, jest} from '@jest/globals';
import { Server } from 'node:http';

// jest.setTimeout(30000);
jest.setTimeout(3 * 60 * 1000);

let server: Server;
beforeAll(done => {
  serverPromise.then(srvr => { server = srvr; done(); })
    .catch(err => {
    console.error(`Getting server failed: ${JSON.stringify(err)}`);
    process.exit(1);
  });
})

afterAll(() => {
  shutDown('SIGJEST');
});

describe("scene", () => {

  it('should whatever', () => {
    expect(1).toEqual(1);
  });

  // it('shoudl whatever', async () => {
  //   const resp = await request(app).get('/scene');
  //   expect(resp.statusCode).toBe(200);
  // });
});