#!/usr/bin/env node
// Simple TCP proxy to expose browser relay (127.0.0.1:18792) on 0.0.0.0:18793
import net from 'node:net';

const LOCAL_PORT = 18793;  // Port exposed to Windows
const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 18792;  // Browser relay internal port

const server = net.createServer((clientSocket) => {
  const targetSocket = net.createConnection(TARGET_PORT, TARGET_HOST, () => {
    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  targetSocket.on('error', (err) => {
    console.error(`Target connection error: ${err.message}`);
    clientSocket.destroy();
  });

  clientSocket.on('error', (err) => {
    console.error(`Client connection error: ${err.message}`);
    targetSocket.destroy();
  });

  clientSocket.on('close', () => targetSocket.destroy());
  targetSocket.on('close', () => clientSocket.destroy());
});

server.listen(LOCAL_PORT, '0.0.0.0', () => {
  console.log(`Browser relay proxy listening on 0.0.0.0:${LOCAL_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
});

server.on('error', (err) => {
  console.error(`Proxy server error: ${err.message}`);
  process.exit(1);
});
