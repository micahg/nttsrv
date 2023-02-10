import * as http from 'http';

import { log } from "./utils/logger";

import * as expressConfig from "./config/express";

const STARTUP_CHECK_SIG = "startup_check";
const STARTUP_DONE_SIG = "startup_done";

log.info(`System starting in ${process.env.NODE_ENV}`);

let db_connected: boolean = false;
let app = expressConfig.create();

// defer listening for requests until we receive an event to check for startup conditions
// events are emitted when a precondition is satisfied (eg: connecton to the db)
const serverPromise = new Promise<http.Server>((resolve, reject) => {
  app.on(STARTUP_CHECK_SIG, () => {
    let srvr = expressConfig.listen(app);
    resolve(srvr);
  });
});

// TODO for unit testing probably export a promise that returns server instead.
export default serverPromise;