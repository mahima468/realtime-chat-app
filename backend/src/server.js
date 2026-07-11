require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const messageRoutes = require("./routes/messageRoutes");
const { registerSocketHandlers } = require("./sockets/socketHandler");

const PORT = process.env.PORT || 5000;
// Comma-separated list, e.g. "http://localhost:5173,http://192.168.1.42:5173"
// Native mobile clients (Expo Go) generally don't send a browser-style Origin
// header at all, so this mainly matters for the web frontend and any browser
// based testing tools.
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  // Requests with no Origin header (native apps, curl, server-to-server)
  // are allowed through; browser requests are checked against the allowlist.
  if (!origin) return true;
  return CLIENT_ORIGINS.includes(origin);
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    methods: ["GET", "POST"],
  },
});

// Make io accessible inside REST controllers (req.app.get("io"))
app.set("io", io);

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/messages", messageRoutes);

// Fallback 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// Central error handler, keeps API errors from crashing the process
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({ success: false, error: "Internal server error." });
});

registerSocketHandlers(io);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat server listening on port ${PORT}`);
  console.log(`Allowing client origins: ${CLIENT_ORIGINS.join(", ")}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
