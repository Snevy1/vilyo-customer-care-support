const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");
// Import the setter (use require since server.js is a Node script)
const { setSocketServer } = require("./lib/socket/socket-server"); 

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  
  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  // CRITICAL: Register the server instance in  lib
  setSocketServer(io);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
  });

  httpServer.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});