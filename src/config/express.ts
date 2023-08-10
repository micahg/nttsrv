import * as os from "os";

import { log } from "../utils/logger";

import * as express from "express";
import * as bodyParser from "body-parser";
import * as multer from "multer";
import { Server } from 'http';
import { updateAsset } from "../routes/asset";
import { PATH_ASSET, STATE_ASSET, VIEWPORT_ASSET } from "../utils/constants";
import { getState, updateState } from "../routes/state";
import { setViewPort } from "../routes/viewport";
import { auth } from "express-openid-connect";

const authcfg = require('../../auth0.json');


/**
 * Create the express middleware.
 * @returns an express app.
 */
export function create(): express.Express {
  let app = express();

  try {
    log.info("Loading auth configuration...");
    const authMiddleware = auth(authcfg);
    log.info("Applying authorization middleware...");
    app.use(authMiddleware);
  } catch (err) {
    log.error(`Unable to configure auth: ${JSON.stringify(err)}`);
  }
  // app.use(auth(authcfg));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  app.use((req, res, next) => {
    if (req.method == "OPTIONS") {
      next();
    }

    log.info(`AUTH IS ${req.oidc.isAuthenticated()}`);
  });
  //   validateAuthorization(req).then(token => {
  //     let err: string = validateTokenFields(token);
  //     if (err) {
  //       log.error(`validateTokenFields fails: ${err}`);
  //       res.status(401).send();
  //       return;
  //     }

  //     res.locals.jwt = token;
  //     next();
  //   }).catch(reason => {
  //     log.error(`validateAuthorization fails: ${reason}`);
  //     res.status(401).send();
  //   });
  // });

  // TODO FIX environment specific cors headers
  app.use((_req, res, next) => {
    // TODO FIX THIS (DEV ONLY)
    res.header("Access-Control-Allow-Origin", "*");
    // TODO FIX THIS (DEV ONLY)
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Content-Length, Accept, Authorization, Spoof-UID");
    // TODO FIX THIS (DEV ONLY)!
    res.header("Access-Control-Allow-Methods", "POST, PUT, PATCH, GET, OPTIONS, DELETE");
    next();
  });

  app.use(express.static('public'));

  let destdir: string = os.tmpdir();
  let upload:multer.Multer = multer({dest: destdir});

  app.put(PATH_ASSET, upload.single('image'), updateAsset);
  app.get(STATE_ASSET, getState);
  app.put(STATE_ASSET, updateState);
  app.put(VIEWPORT_ASSET, setViewPort);

  return app;
}

export function listen(app: express.Express): Server {
  return app.listen(3000, () => {
    log.info(`Listening on port 3000`);
  });
}