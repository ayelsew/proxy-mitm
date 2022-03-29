import net from "net";
import type { IncomingMessage, Server } from 'http';

function byPassSSL(req: IncomingMessage, res: any, head: Buffer){
  const url = req.url?.split(':') as unknown as string;
  const byPassSocket = new net.Socket();

  byPassSocket.connect(Number(url[1]), url[0], () => {
    byPassSocket.write(head);
    res.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
  })

  byPassSocket.on('data', (chuck: Buffer) => {
    res.write(chuck);
  })

  byPassSocket.on('end', () => {
    res.end()
  })

  byPassSocket.on('error', () => {
    res.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
    res.end();
  })

  res.on('data', (chuck: Buffer) => {
    byPassSocket.write(chuck);
  })

  res.on('end', () => {
    byPassSocket.end();
  });

  res.on('error', () => {
    byPassSocket.end();
  });
}

export function bind(server: Server, allowedHosts: string[] = []) {
  server.on('connect', (req, res, head) => {
    const url = req.url?.split(':') as unknown as string;

    if (!allowedHosts.includes(url[0])) {
      /* console.log(url[0], 'BY PASSED'); */
      byPassSSL(req, res, head)
      return;
    }

    //console.log(url[0], 'IT WAS INTERCEPTED!');
    // connect to an origin server
    const mitm_socket = net.connect('8080', function () {
      res.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node-Proxy\r\n' + '\r\n');
    });

    mitm_socket.on('data', function (d) { res.write(d) });
    res.on('data', function (d) {  mitm_socket.write(d) });

    mitm_socket.on('end', function () { res.end() });
    res.on('end', function () { mitm_socket.end() });

    mitm_socket.on('close', function () { res.end() });
    res.on('close', function () { mitm_socket.end() });

    mitm_socket.on('error', function () { res.end() });
    res.on('error', function () { mitm_socket.end() });
  })
}
