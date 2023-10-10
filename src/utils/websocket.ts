import { IncomingMessage, Server } from 'http';
import { Express } from 'express';
import { EventEmitter, WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { verify } from 'jsonwebtoken';

import { ASSETS_UPDATED_SIG } from './constants';

import { log } from "./logger";
import { getTableState, TableState } from './tablestate';
import { getFakeUser } from './auth';
import { IScene } from '../models/scene';

interface WSStateMessage {
  method?: string,
  state?: TableState,
}

const AUD: string = process.env.AUDIENCE_URL || 'http://localhost:3000/';
const ISS: string = process.env.ISSUER_URL   || 'https://nttdev.us.auth0.com/';
const AUTH_REQURIED: boolean = process.env.DISABLE_AUTH?.toLowerCase() !== "true";
const SOCKET_SESSIONS: Map<string, WebSocket> = new Map();


function getVerifiedToken(token: string, pem: string) {
  if (!AUTH_REQURIED) return { sub: getFakeUser() };
  return verify(token, pem, { audience: AUD, issuerBaseURL: ISS, tokenSigningAlg: 'RS256' });
}


function verifyConnection(sock: WebSocket, req: IncomingMessage, pem: string) {
  log.info(`Websocket connection established ${req.socket.remoteAddress}`);
  let jwt: any;
  try {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const token = parsed.searchParams.get('bearer');
    if (!token) throw new Error('Token not present');
    jwt = getVerifiedToken(token, pem);
  } catch (err) {
    if (err.hasOwnProperty('message')) {
      log.error(`WS token fail: ${err.message} (${JSON.stringify(err)})`);
    } else {
      log.error(`WS token fail: ${err}`);
    }
    sock.close();
    return;
  }

  // kill the old session (this means we only ever have one client)
  const user = jwt.sub;
  if (SOCKET_SESSIONS.has(user)) {
    SOCKET_SESSIONS.get(user).close();
    SOCKET_SESSIONS.delete(user);
  }
  SOCKET_SESSIONS.set(user, sock);

  let state: TableState = getTableState();
  // don't send a partial display without overlay by accident
  if (state.overlay === null) {
    state = null;
  }
  let msg: WSStateMessage = {
    'method': 'connection',
    'state': state,
  }
  sock.send(JSON.stringify(msg));
  sock.on('message', (buf) => {
    let data = buf.toString();
    log.info(`Received "${data}"`);
  });
}

export function startWSServer(nodeServer: Server, app: Express, pem: string) {
  log.info('starting websocket server');
  let wss = new WebSocketServer({server: nodeServer});
  let emitter = app as EventEmitter;

  emitter.on(ASSETS_UPDATED_SIG, (update: IScene) => {
    const userID = update.user.toString();
    if (!SOCKET_SESSIONS.has(userID)) return;
    let tableState: TableState = {
      overlay: update.overlayContent,
      background: update.tableContent,
      viewport: update.viewport,
      backgroundSize: update.backgroundSize,
    }
    const sock: WebSocket = SOCKET_SESSIONS.get(userID);
    const msg: WSStateMessage = {
      method: ASSETS_UPDATED_SIG,
      state: tableState,
    }
    log.info(`Sending ${JSON.stringify(msg)}`);
    sock.send(JSON.stringify(msg));
    // wss.clients.forEach((sock:WebSocket) => {
    //   let msg: WSStateMessage = {
    //     'method': ASSETS_UPDATED_SIG,
    //     'state': tableState,
    //   }
    //   console.log(`Sending ${JSON.stringify(msg)}`)
    //   sock.send(JSON.stringify(msg));
    // });
  });
  // emitter.on(ASSETS_UPDATED_SIG, (update: TableState) => {
  //   wss.clients.forEach((sock:WebSocket) => {
  //     let msg: WSStateMessage = {
  //       'method': ASSETS_UPDATED_SIG,
  //       'state': update,
  //     }
  //     console.log(`Sending ${JSON.stringify(msg)}`)
  //     sock.send(JSON.stringify(msg));
  //   });
  // });

  wss.on('connection', verifyConnection);
  return wss;
}