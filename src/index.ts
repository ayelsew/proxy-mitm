import { init as initTCP } from './core/tcp';
import { init as initHTTP } from './core/http';
import { init as initHTTPS } from './core/https';
import { bind } from './core/bind';

import { InterceptWebSocket } from './InterceptWebSocket';
import { TransportTx } from './Transport';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

Promise.all([
  initTCP(8080),
  initHTTP(8082),
  initHTTPS(8081)
]).then(([tcp, http, https]) => {
  bind(http, ["api-v2.blaze.com", "blaze.com", "www.google.com"]);
  const interceptWebSocket: InterceptWebSocket = new InterceptWebSocket([http, https]);
  const transportTx: TransportTx = new TransportTx(1234, '127.0.0.1')

  transportTx.on('error', (error) => console.error(error));

  //transport.on('desconnected', () => console.log('Transporte OFF'));
  transportTx.on('connected', () => console.log('Transporte ON'));

  interceptWebSocket.on('tx', (data: string | Buffer) => {
    transportTx.write(data)
  })

  interceptWebSocket.on('rx', (data: string | Buffer) => {
    transportTx.write(data)
  })
})
