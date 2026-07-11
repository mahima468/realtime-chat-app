import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({
  messages,
  username,
  typingUsers,
  onSend,
  onTypingStart,
  onTypingStop,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  return (
    <div className="chat-window">
      <div className="message-list">
        {messages.length === 0 && (
          <p className="empty-state">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwnMessage={msg.username === username}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <TypingIndicator typingUsers={typingUsers} />
      <MessageInput
        onSend={onSend}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </div>
  );
}
