import { mkdir } from 'node:fs';
import { Server } from 'http';

import { log } from "./utils/logger";

import * as expressConfig from "./config/express";
import { startWSServer } from './utils/websocket';
import { STARTUP_CHECK_SIG, STARTUP_DONE_SIG } from './utils/constants';
import { getOAuthPublicKey } from './utils/auth';

import { connect } from './config/mongoose';

log.info(`System starting in ${process.env.NODE_ENV}`);

// startup flags
let mongoConnectedFlag = false;
let storageConnectedFlag = false;

let app = expressConfig.create();

// defer listening for requests until we receive an event to check for startup conditions
// events are emitted when a precondition is satisfied (eg: connecton to the db)
const serverPromise = new Promise<Server>((resolve, reject) => {
  app.on(STARTUP_CHECK_SIG, () => {

    if (!mongoConnectedFlag) return;
    if (!storageConnectedFlag) return;

    log.info('All startup flags set');

    // presumably the dir was created and we don't need to check for it.
    let srvr: Server = expressConfig.listen(app);
    getOAuthPublicKey().then(pem => {
      log.info('Retrieved OAuth PEM');
      let wss = startWSServer(srvr, app, pem);
      app.emit(STARTUP_DONE_SIG);
      resolve(srvr);
    }).catch(err => {
      log.error(`Unable to getOAuthPublicKey: ${JSON.stringify(err)}`);
      process.exit(1);
    })
  });
});

// TODO move this to the storage driver
log.info(`Create public resources folder...`);
mkdir('public', {recursive: true}, (err, path) => {
  if (err) {
    log.error(`Unable to create public folder: ${JSON.stringify(err)}`);
    process.exit(1);
  }
  log.info(`Created public asset path`);
  storageConnectedFlag = true;
  app.emit(STARTUP_CHECK_SIG);
});

connect().then(() => {
  mongoConnectedFlag = true;
  log.info('MongoDB connection succeeded');
  app.emit(STARTUP_CHECK_SIG);
}).catch(err => {
  log.error(`Unable to ping mongo: ${err}`);
  process.exit(1);
});

// TODO for unit testing probably export a promise that returns server instead.
export default serverPromise;