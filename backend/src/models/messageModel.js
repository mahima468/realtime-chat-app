const { nanoid } = require("nanoid");
const db = require("../config/db");

const insertStmt = db.prepare(
  `INSERT INTO messages (id, username, text, created_at, status)
   VALUES (@id, @username, @text, @created_at, @status)`
);

const selectAllStmt = db.prepare(
  `SELECT id, username, text, created_at AS createdAt, status
   FROM messages
   ORDER BY created_at ASC`
);

const updateStatusStmt = db.prepare(
  `UPDATE messages SET status = ? WHERE id = ?`
);

function createMessage({ username, text }) {
  const message = {
    id: nanoid(),
    username,
    text,
    created_at: new Date().toISOString(),
    status: "sent",
  };
  insertStmt.run(message);
  return {
    id: message.id,
    username: message.username,
    text: message.text,
    createdAt: message.created_at,
    status: message.status,
  };
}

function getAllMessages() {
  return selectAllStmt.all();
}

function updateMessageStatus(id, status) {
  updateStatusStmt.run(status, id);
}

module.exports = {
  createMessage,
  getAllMessages,
  updateMessageStatus,
};
