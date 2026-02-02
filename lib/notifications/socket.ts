import { io } from "socket.io-client";
// This is for the frontend to connect
export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
  autoConnect: false,
});