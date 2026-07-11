const express = require("express");
const { getMessages, postMessage } = require("../controllers/messageController");

const router = express.Router();

// GET  /api/messages  -> fetch chat history
router.get("/", getMessages);

// POST /api/messages  -> send a new message
router.post("/", postMessage);

module.exports = router;
