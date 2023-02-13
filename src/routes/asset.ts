import { cp, rm } from 'node:fs';

import { Request, Response } from "express";

import { log } from "../utils/logger";
import { loggers } from 'winston';

export function updateAsset(req: Request, res: Response, next: any) {
    if (!req.file) {
      res.sendStatus(406);
      return;
    }

    if (req.file.mimetype != 'image/png') {
      log.error(`Invalid mime type: ${req.file.mimetype}`);
      res.sendStatus(400);
    }

    let dest = 'public/overlay.png';
    let src = req.file.path;
    cp(src, dest, {force: true, preserveTimestamps: true}, err => {
      if (err) {
        log.error(`Unable to copy ${src} to ${dest}`);
        return res.sendStatus(500);
      }

      rm(src, {force: true}, err => {
        if (err) {
          log.error(`Unable to delete ${src}`);
        }
        return res.sendStatus(204);
      })
    });
}