import { log } from "../utils/logger";
import { promises, resolveAny } from 'dns';
import * as https from 'https';

export function getOAuthPublicKey(): Promise<string> {
  if (process.env.DISABLE_AUTH?.toLowerCase() === "true") {
    return Promise.resolve(null);
  }

  const iss: string = process.env.ISSUER_URL ||  'https://nttdev.us.auth0.com';
  const pem: string = `${iss}/pem`;

  return new Promise((resolve, reject) => {
    try {
      https.get(pem, res => {
        if (res.statusCode !== 200)
          return reject(`Error fetching PEM: ${res.statusCode}`);
        let body = '';
        res.on('data', data => body += data);
        res.on('end', () => resolve(body));
        res.on('error', err => reject(err));
      });
    } catch(err) {
      reject(err);
    }
  });
}