import { server as Server, client as Client } from 'websocket';
import { EventEmitter } from 'events'
import type {
  IServerConfig,
  request as Request,
  Message,
  connection as Connection
} from 'websocket';

enum Protocol {
  WSS = 'wss',
  WS = 'ws'
}

export class InterceptWebSocket extends EventEmitter {
  constructor(httpServer: IServerConfig['httpServer']) {
    super();

    const serverWS = new Server({
      httpServer,
      autoAcceptConnections: false
    })

    serverWS.on('request', (request: Request) => {
      const protocol: Protocol = request.origin.split(':')[0] === 'https' ? Protocol.WSS : Protocol.WS;
      const hostname: string = request.httpRequest.headers.host || 'nothing';
      const clientWS = new Client();
      let bufferMessage: Message[] = [];

      const connection = request.accept(undefined, request.origin);

      const onMessageCache = (message: Message) => {
        bufferMessage.push(message);
      }

      const onErrorConnection = (error: Error) => {
        console.log(error);
        clientWS.abort();
      }

      connection.on('message', onMessageCache);
      connection.on('error', onErrorConnection);

      clientWS.on('connect', (proxyConnection: Connection) => {
        connection.off('message', onMessageCache);
        connection.off('error', onErrorConnection);


        bufferMessage.forEach((message) => {
          if (message.type === 'utf8') {
            proxyConnection.sendUTF(message.utf8Data);
            return;
          }
          proxyConnection.sendBytes(message.binaryData);
        });
        bufferMessage = [];

        proxyConnection.on('message', (message) => {
          if (message.type === 'utf8') {
            connection.sendUTF(message.utf8Data);
            //analystcs(message.utf8Data);
            // console.log('DOWN: ', message.utf8Data)
            this.emit('rx', message.utf8Data)
            return;
          }
          connection.sendBytes(message.binaryData);
          //analystcs(message.binaryData)
          // console.log('DOWN: ',message.binaryData)
          this.emit('rx', message.binaryData)
        });

        connection.on('message', (message) => {
          console.log('WSSS: ', )
          if (message.type === 'utf8') {
            proxyConnection.sendUTF(message.utf8Data);
            // console.log('UP: ',message.utf8Data)
            this.emit('tx', message.utf8Data)
            return;
          }
          proxyConnection.sendBytes(message.binaryData);
          // console.log('UP: ',message.binaryData)
          this.emit('tx', message.binaryData)
        });

        proxyConnection.on('error', (error) => {
          console.log('ERROR: PROXY WS -> SERVER WS');
          console.error(error);
        });

        connection.on('error', (error) => {
          console.log('ERROR: SERVER WS -> PROXY WS');
          console.error(error);
        });

        proxyConnection.on('close', () => {
          connection.close();
        })

        connection.on('close', () => {
          proxyConnection.close();
        })
      })

      console.log('Connecting: ', `${protocol}://${hostname}${request.resourceURL.path}`)
      clientWS.connect(`${protocol}://${hostname}${request.resourceURL.path}`, undefined, request.origin, request.httpRequest.headers)
    })
  }
}
