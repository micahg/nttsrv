import { Server } from 'http';
import { Express } from 'express';
import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { ASSET_UPDATED_SIG } from './constants';

import { log } from "./logger";

export function startWSServer(nodeServer: Server, app: Express) {
  log.info('starting websocket server');
  let wss = new WebSocketServer({server: nodeServer});

  app.on(ASSET_UPDATED_SIG, () => {
    wss.clients.forEach((sock:WebSocket) => {
      let msgJS = {
        'method': ASSET_UPDATED_SIG,
        'overlay': 'overlay.png',
      }
      sock.send(JSON.stringify(msgJS));
    });
  });

  wss.on('connection', (sock: WebSocket, req) => {
    log.info(`Websocket connection established ${req.socket.remoteAddress}`);
    let msgJS = {
      'method': 'connection',
      'overlay': 'overlay.png',
    }
    sock.send(JSON.stringify(msgJS));
    sock.on('message', (buf) => {
      let data = buf.toString();
      log.info(`Received "${data}"`);
      sock.send('hey yourself');
    });
  });
  return wss;
}