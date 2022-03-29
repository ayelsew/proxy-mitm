import http from 'http';
import type { RequestOptions, IncomingMessage, ServerResponse, Server } from 'http';

import { doRequest, Mode, buildOptions } from './client';

const serverHTTP = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  const validHost = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/.test(req.headers.host as unknown as string)
  if (!validHost) {
    res.writeHead(400);
    res.end(`Hostname: ${req.headers.host} is not valid.`);
    return;
  }

  doRequest(Mode.HTTPS, req, res, buildOptions(req));
});

export const init = (port: number): Promise<Server> => new Promise((resolve) => {
  serverHTTP.listen(port, () => {
    console.log('HTTP on ' + port)
    resolve(serverHTTP)
  })
})
