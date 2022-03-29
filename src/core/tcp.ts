import net, { Socket, Server } from "net";

const serverTCP = net.createServer((socket: Socket) => {
  const handleErrorTCP = (error: Error) => {
    console.log("TCP Error: ", error);
  }

  socket.on('error', handleErrorTCP);

  socket.once('data', (buffer) => {
    socket.off('error', handleErrorTCP);

    const address = buffer[0] === 22 ? 8081 : 8082;
    const server = net.createConnection(address, '0.0.0.0', () => {
      server.write(buffer);
      socket.pipe(server).pipe(socket);
    });

    server.on('close', () => {
      socket.end();
    })

    socket.on('close', () => {
      server.end();
    });

    server.on('error', (error) => {
      console.error(error);
      socket.end();
    });

    socket.on('error', (error) => {
      console.error(error);
      server.end();
    });
  })
})


export const init = (port: number): Promise<Server> => new Promise((resolve) => {
  serverTCP.listen(port, '0.0.0.0', () => {
    console.log('TCP proxy started at 8080');
    resolve(serverTCP);
  });
})


