// lib/socket-server.ts
import { Server } from 'socket.io';

let io;

export function setSocketServer(server) {
  io = server;
}

export function getSocketServer() {
  return io;
}