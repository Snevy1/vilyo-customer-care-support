const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

/**
 * 🔥 HARD DEBUGGING — DO NOT SKIP
 * These will expose the hidden JSON.parse location
 */
process.on("uncaughtException", (err) => {
  console.error("\n🔥 UNCAUGHT EXCEPTION 🔥");
  console.error(err);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("\n🔥 UNHANDLED PROMISE REJECTION 🔥");
  console.error(reason);
});

/**
 * Log environment JSON suspects (safe)
 */
for (const [key, value] of Object.entries(process.env)) {
  if (
    key.includes("JSON") ||
    key.includes("CONFIG") ||
    key.includes("SETTINGS") ||
    key.includes("PROVIDERS") ||
    key.includes("FEATURE")
  ) {
    console.log(`⚠ ENV CHECK → ${key}:`, value);
  }
}

console.log("✅ server.cjs starting…");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

console.log("✅ Next.js instance created");

app
  .prepare()
  .then(() => {
    console.log("✅ Next.js prepared");

    const httpServer = createServer(handle);

    console.log("✅ HTTP server created");

    const io = new Server(httpServer, {
      cors: { origin: "*" },
    });

    console.log("✅ Socket.IO initialized");

    /**
     * 🔥 IMPORTANT:
     * Delay this import to catch JSON.parse errors inside it
     */
    try {
      const { setSocketServer } = require("./lib/socket/socket-server");
      setSocketServer(io);
      console.log("✅ Socket server registered");
    } catch (err) {
      console.error("\n🔥 ERROR LOADING socket-server 🔥");
      console.error(err);
      console.error(err.stack);
      process.exit(1);
    }

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);
    });

    httpServer.listen(3000, () => {
      console.log("> Ready on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("\n🔥 NEXT PREPARE FAILED 🔥");
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  });
