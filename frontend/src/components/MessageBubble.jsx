function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isOwnMessage }) {
  const { username, text, createdAt, status } = message;

  return (
    <div className={`message-row ${isOwnMessage ? "own" : "other"}`}>
      <div className="message-bubble">
        {!isOwnMessage && <div className="message-author">{username}</div>}
        <div className="message-text">{text}</div>
        <div className="message-meta">
          <span className="message-time">{formatTimestamp(createdAt)}</span>
          {isOwnMessage && (
            <span className={`message-status status-${status}`}>
              {status === "sending" && "Sending..."}
              {status === "sent" && "Sent"}
              {status === "delivered" && "Delivered"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
