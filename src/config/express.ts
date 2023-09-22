import * as os from "os";

import { log } from "../utils/logger";

import * as express from "express";
import { Express, NextFunction } from "express";
import * as bodyParser from "body-parser";
import * as multer from "multer";
import { Server } from 'http';
import { updateAsset } from "../routes/asset";
import { NO_AUTH_ASSET, PATH_ASSET, STATE_ASSET, VIEWPORT_ASSET } from "../utils/constants";
import { getState, updateState } from "../routes/state";
import { setViewPort } from "../routes/viewport";

import { auth } from "express-oauth2-jwt-bearer";


/**
 * Create the express middleware.
 * @returns an express app.
 */
export function create(): Express {
  let app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  
  const noauth: boolean = process.env.DISABLE_AUTH?.toLowerCase() === "true";
  const aud: string = process.env.AUDIENCE_URL || 'http://localhost:3000/';
  const iss: string = process.env.ISSUER_URL ||  'https://nttdev.us.auth0.com/';
  
  if (noauth) {
    log.warn("Authenticaiton disabled");
  }

  // without auth stub out the normally needed fields so we don't have to
  // handle unauthenticated requests specially. Otherwise, let auth0 populate
  // the JWT authentication token claims.
  const jwtCheck = noauth ? (_rq: any, _rs: any, next: NextFunction) => {
    _rq.auth = {
      payload: {
        sub: "noauth|0"
      }
    }
    return next()
  }: auth({
      audience: aud,
      issuerBaseURL: iss,
      tokenSigningAlg: 'RS256'
  });

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

  app.get(NO_AUTH_ASSET,  (_req, res) => res.status(200).send({noauth: noauth}));
  app.put(PATH_ASSET,     jwtCheck, upload.single('image'), updateAsset);
  app.get(STATE_ASSET,    jwtCheck, getState);
  app.put(STATE_ASSET,    jwtCheck, updateState);
  app.put(VIEWPORT_ASSET, jwtCheck, setViewPort);

  // handle errors
  app.use((err, _req, res, next) => {
    if (!err) next();
    if (err.status) {
      return res.sendStatus(err.status);
    }
    log.error(`Unexpected Error: ${JSON.stringify(err)}`);
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