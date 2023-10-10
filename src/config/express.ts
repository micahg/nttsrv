import * as os from "os";

import { log } from "../utils/logger";

import * as express from "express";
import { Express, NextFunction } from "express";
import * as bodyParser from "body-parser";
import * as multer from "multer";
import { Server } from 'http';
import { updateAsset } from "../routes/asset";
import { NO_AUTH_ASSET, PATH_ASSET, ALL_SCENES_PATH, STATE_ASSET,
         VIEWPORT_ASSET, SCENE_PATH, SCENE_CONTENT_PATH,
         SCENE_VIEWPORT_PATH } from "../utils/constants";
import { getState, updateState } from "../routes/state";
import { setViewPort } from "../routes/viewport";

import { auth } from "express-oauth2-jwt-bearer";
import { createScene, getScene, getScenes, updateSceneContent, updateStateViewport } from "../routes/scene";
import { getFakeUser } from "../utils/auth";

function getJWTCheck(noauth: boolean) {
  const aud: string = process.env.AUDIENCE_URL || 'http://localhost:3000/';
  const iss: string = process.env.ISSUER_URL ||  'https://nttdev.us.auth0.com/';

  if (noauth) {
    log.warn("Authenticaiton disabled");
  }

  // without auth stub out the normally needed fields so we don't have to
  // handle unauthenticated requests specially. Otherwise, let auth0 populate
  // the JWT authentication token claims.
  return noauth ? (_rq: any, _rs: any, next: NextFunction) => {
    _rq.auth = {
      payload: {
        sub: getFakeUser()
      }
    }
    return next()
  }: auth({
    audience: aud,
    issuerBaseURL: iss,
    tokenSigningAlg: 'RS256'
  });
}

/**
 * Create the express middleware.
 * @returns an express app.
 */
export function create(): Express {
  const noauth: boolean = process.env.DISABLE_AUTH?.toLowerCase() === "true";
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  const jwtCheck = getJWTCheck(noauth);

  // add request logging
  app.use((req, res, next) => {
    res.on('finish', () => log.info('processed', {method: req.method, path: req.path, status: res.statusCode}));
    next();
  })

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

  app.get(NO_AUTH_ASSET,                (_req, res) => res.status(200).send({noauth: noauth}));
  app.put(PATH_ASSET,         jwtCheck, upload.single('image'), updateAsset);
  app.get(STATE_ASSET,        jwtCheck, getState);
  app.put(STATE_ASSET,        jwtCheck, updateState);
  app.put(VIEWPORT_ASSET,     jwtCheck, setViewPort);
  app.put(SCENE_VIEWPORT_PATH,jwtCheck, updateStateViewport)
  app.get(SCENE_PATH,         jwtCheck, getScene);
  app.get(ALL_SCENES_PATH,    jwtCheck, getScenes);
  app.put(ALL_SCENES_PATH,    jwtCheck, createScene);
  app.put(SCENE_CONTENT_PATH, jwtCheck, upload.single('image'), updateSceneContent);

  // handle errors
  app.use((err, req, res, next) => {
    if (!err) next();
    if (err.status) return res.sendStatus(err.status);
    
    // generic in-app exception handling
    if (err.cause) {
      log.error(`${req.method} failed`, {status: err.cause, err: err.message});
      return res.sendStatus(err.cause);
    }
    log.error(`Unexpected Error: ${err.message}`);
    res.sendStatus(500);
    next();
  });

  return app;
}

export function listen(app: express.Express): Server {
  return app.listen(3000, () => {
    log.info(`Listening on port 3000`);
  });
}