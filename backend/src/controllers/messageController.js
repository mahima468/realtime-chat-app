const messageModel = require("../models/messageModel");

/**
 * GET /api/messages
 * Fetch full chat history, ordered oldest -> newest.
 */
function getMessages(req, res) {
  try {
    const messages = messageModel.getAllMessages();
    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch chat history." });
  }
}

/**
 * POST /api/messages
 * Persist a new message. Real-time delivery is handled separately
 * over the socket, but the REST endpoint guarantees messages are
 * saved even for clients that only talk HTTP (and it's what the
 * socket handler calls under the hood to avoid duplicating logic).
 */
function postMessage(req, res) {
  try {
    const { username, text } = req.body;

    if (!username || typeof username !== "string" || !username.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "username is required." });
    }
    if (!text || typeof text !== "string" || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "text is required." });
    }

    const message = messageModel.createMessage({
      username: username.trim(),
      text: text.trim(),
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("message:new", message);
    }

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error("Error creating message:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to send message." });
  }
}

module.exports = { getMessages, postMessage };
