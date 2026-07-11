const messageModel = require("../models/messageModel");

// username -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map();

function broadcastOnlineUsers(io) {
  io.emit("presence:update", Array.from(onlineUsers.keys()));
}

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // --- Username-based "login" (dummy auth, no password) ---
    socket.on("user:join", (username) => {
      try {
        if (!username || typeof username !== "string" || !username.trim()) {
          socket.emit("error:app", "A valid username is required to join.");
          return;
        }
        const cleanName = username.trim();
        socket.data.username = cleanName;

        if (!onlineUsers.has(cleanName)) {
          onlineUsers.set(cleanName, new Set());
        }
        onlineUsers.get(cleanName).add(socket.id);

        socket.emit("user:joined", cleanName);
        broadcastOnlineUsers(io);
        console.log(`${cleanName} joined (${socket.id})`);
      } catch (err) {
        console.error("Error in user:join handler:", err);
        socket.emit("error:app", "Could not join chat. Please try again.");
      }
    });

    // --- New chat message ---
    socket.on("message:send", (payload, ack) => {
      try {
        const username = socket.data.username;
        const text = payload && typeof payload.text === "string" ? payload.text.trim() : "";
        // Echoed back only over the wire so the sender's own client can
        // reconcile its optimistic "sending" bubble with the real message;
        // it is never persisted to the database.
        const clientTempId = payload && payload.clientTempId;

        if (!username) {
          socket.emit("error:app", "You must join with a username before sending messages.");
          return;
        }
        if (!text) {
          socket.emit("error:app", "Message text cannot be empty.");
          return;
        }

        const message = messageModel.createMessage({ username, text });

        // Broadcast to everyone, including sender, so all clients render
        // from a single source of truth.
        io.emit("message:new", { ...message, clientTempId });

        // Acknowledge back to the sender so the UI can flip the message
        // from "sending" to "delivered".
        if (typeof ack === "function") {
          ack({ success: true, message });
        }
        messageModel.updateMessageStatus(message.id, "delivered");
        io.emit("message:status", { id: message.id, status: "delivered" });
      } catch (err) {
        console.error("Error in message:send handler:", err);
        if (typeof ack === "function") {
          ack({ success: false, error: "Failed to send message." });
        }
        socket.emit("error:app", "Failed to send message. Please try again.");
      }
    });

    // --- Typing indicator ---
    socket.on("typing:start", () => {
      const username = socket.data.username;
      if (!username) return;
      socket.broadcast.emit("typing:update", { username, isTyping: true });
    });

    socket.on("typing:stop", () => {
      const username = socket.data.username;
      if (!username) return;
      socket.broadcast.emit("typing:update", { username, isTyping: false });
    });

    // --- Disconnect handling ---
    socket.on("disconnect", (reason) => {
      try {
        const username = socket.data.username;
        console.log(`Socket disconnected: ${socket.id} (${reason})`);

        if (username && onlineUsers.has(username)) {
          const sockets = onlineUsers.get(username);
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(username);
          }
          broadcastOnlineUsers(io);
        }
      } catch (err) {
        console.error("Error in disconnect handler:", err);
      }
    });

    socket.on("error", (err) => {
      console.error(`Socket error on ${socket.id}:`, err);
    });
  });
}

module.exports = { registerSocketHandlers };
