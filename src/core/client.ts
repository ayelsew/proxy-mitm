import https from 'https';
import http from 'http';
import zlib from 'zlib';
import fs from 'fs';
import type { RequestOptions, IncomingMessage, ServerResponse, ClientRequest } from 'http';

export enum Mode {
  HTTP = "HTTP",
  HTTPS = "HTTPS"
}

export function doRequest(mode: Mode, request: IncomingMessage, response: ServerResponse, options: RequestOptions) {
  let proxyRequest: ClientRequest;

  try {
    proxyRequest = mode === Mode.HTTP ? http.request(options) : https.request(options);
  } catch (error) {
    response.end(error.message);
    return;
  }

  proxyRequest.on('response', (proxyResponse: IncomingMessage) => {
    const cache1 = []
    proxyResponse.on('data', (buffer) => {
      cache1.push(buffer);
    });

    proxyResponse.on('end', () => {
      if (options.hostname === 'www.google.com' && options.path === '/' && options.method === 'GET') {

        let body = zlib.brotliDecompressSync(Buffer.concat(cache1));
        const injectable = Buffer.from(`
          <script>
            /* TESTANDO 123 
            setTimeout(() => {
              //alert("Renan TESUDO");
              //window.location.href = 'https://xvideos.com'
            }, 3000) */
          </script>
        `);
        body = Buffer.concat([body, injectable]);
        console.log(body.length)

        response.writeHead(proxyResponse.statusCode || 500, { ...proxyResponse.headers, 'content-length': body.length });
        response.write(zlib.brotliCompressSync(body), 'binary');
      } else {
        response.write(Buffer.concat(cache1), 'binary');
      }
      response.end();
    });
    response.writeHead(proxyResponse.statusCode || 500, proxyResponse.headers);
  });

  request.on('data', (buffer) => {
    proxyRequest.write(buffer, 'binary');
  });

  request.on('end', () => {
    proxyRequest.end();
  });
}

export function buildOptions(req: IncomingMessage) {
  const url = req.headers.host?.split(':') as unknown as string

  const requestOptions: RequestOptions = {
    hostname: url[0],
    path: req.url,
    method: req.method,
    headers: req.headers
  }

  return requestOptions;
}
