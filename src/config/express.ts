import * as os from "os";

import { log } from "../utils/logger";

import * as express from "express";
import * as bodyParser from "body-parser";
import { Server } from 'http';

/**
 * Create the express middleware.
 * @returns an express app.
 */
export function create(): express.Express {
  let app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  app.use((req, res, next) => {
    if (req.method == "OPTIONS") {
      next();
      return;
    }

    // validateAuthorization(req).then(token => {
    //   let err: string = validateTokenFields(token);
    //   if (err) {
    //     log.error(`validateTokenFields fails: ${err}`);
    //     res.status(401).send();
    //     return;
    //   }

    //   res.locals.jwt = token;
    //   next();
    // }).catch(reason => {
    //   log.error(`validateAuthorization fails: ${reason}`);
    //   res.status(401).send();
    // });
  });

  // TODO FIX environment specific cors headers
  app.use((_req, res, next) => {
    // TODO FIX THIS (DEV ONLY)
    res.header("Access-Control-Allow-Origin", "*");
    // TODO FIX THIS (DEV ONLY)
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Spoof-UID");
    // TODO FIX THIS (DEV ONLY)!
    res.header("Access-Control-Allow-Methods", "POST, PUT, PATCH, GET, OPTIONS, DELETE");
    next();
  });

  let destdir: string = os.tmpdir();

  app.get('/', (req, res) => { res.status(200).send('hey there'); });

  return app;
}

export function listen(app: express.Express):  Server {
  return app.listen(3000, () => {
    log.info(`Listening on port 3000`);
  });
}