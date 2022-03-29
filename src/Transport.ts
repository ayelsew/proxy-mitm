import net from 'net';
import { EventEmitter } from 'events'

interface NetError extends Error {
  errno?: number,
  code?: string | 'ECONNREFUSED',
  syscall?: string,
  address?: string,
  port?: number
}

export class TransportTx extends EventEmitter {
  private socket: net.Socket;
  private persist: boolean = true;
  private cacheBuffer: (Uint8Array | string)[] = []
  private connected: boolean = false;

  constructor(port: number, host: string, persist: boolean = true) {
    super();
    this.createConnection(port, host);
    this.persist = persist;
  }

  private createConnection(port: number, host: string) {
    this.socket = net.createConnection({ port, host });

    this.socket.on('error', (error: NetError) => {
      if (error.code !== 'ECONNREFUSED') this.emit('error', error)
    })

    this.socket.on('close', () => {
      this.connected = false;
      this.emit('desconnected')
      if (this.persist === true) this.createConnection(port, host);
    })

    this.socket.on('connect', () => {
      this.cacheBuffer.forEach((data) => this.socket.write(data));
      this.cacheBuffer = [];
      this.connected = true;
      this.emit('connected')
    })
  }

  public write(data: Uint8Array | string) {
    if (!this.connected) {
      this.cacheBuffer.push(data);
      return;
    }

    this.socket.write(data);
  }
}