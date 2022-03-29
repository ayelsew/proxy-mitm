import https, { ServerOptions, Server } from 'https';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

import { doRequest, Mode, buildOptions } from './client';

const serverHTTPSOptions: ServerOptions = {
  key: fs.readFileSync(path.resolve(__dirname, '../../ssl/server.key')),
  cert: fs.readFileSync(path.resolve(__dirname, '../../ssl/server.crt'))
}

const serverHTTPS = https.createServer(serverHTTPSOptions, (req: IncomingMessage, res: ServerResponse) => {
  const validHost = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/.test(req.headers.host as unknown as string)
  if (!validHost) {
    res.writeHead(400);
    res.end(`Hostname: ${req.headers.host} is not valid.`);
    return;
  }

  doRequest(Mode.HTTPS, req, res, buildOptions(req));
});

export const init = (port: number): Promise<Server> => new Promise((resolve) => {
  serverHTTPS.listen(port, () => {
    console.log('HTTPS on ' + port)
    resolve(serverHTTPS);
  })
})
