import { useEffect, useState, useCallback, useRef } from "react";
import Login from "./components/Login";
import ChatWindow from "./components/ChatWindow";
import UserList from "./components/UserList";
import { fetchMessageHistory } from "./api/api";
import { socket } from "./socket/socket";

function makeTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function App() {
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [banner, setBanner] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  const usernameRef = useRef(username);
  usernameRef.current = username;

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoadingHistory(true);

    fetchMessageHistory()
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setBanner("Could not load chat history from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    socket.connect();
    socket.emit("user:join", username);

    function handleConnect() {
      setConnected(true);
      // Re-announce presence after a reconnect.
      socket.emit("user:join", usernameRef.current);
    }
    function handleDisconnect() {
      setConnected(false);
    }
    function handlePresenceUpdate(users) {
      setOnlineUsers(users);
    }
    function handleNewMessage(msg) {
      setMessages((prev) => {
        // Reconcile our own optimistic "sending" bubble with the real
        // message that just came back over the wire.
        if (msg.clientTempId) {
          const hasTemp = prev.some((m) => m.id === msg.clientTempId);
          if (hasTemp) {
            const { clientTempId, ...clean } = msg;
            return prev.map((m) => (m.id === clientTempId ? clean : m));
          }
        }
        if (prev.some((m) => m.id === msg.id)) return prev;
        const { clientTempId, ...clean } = msg;
        return [...prev, clean];
      });
    }
    function handleStatusUpdate({ id, status }) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
    }
    function handleTypingUpdate({ username: who, isTyping }) {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(who) ? prev : [...prev, who];
        }
        return prev.filter((u) => u !== who);
      });
    }
    function handleAppError(message) {
      setBanner(message);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("message:new", handleNewMessage);
    socket.on("message:status", handleStatusUpdate);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("error:app", handleAppError);

    return () => {
      cancelled = true;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("message:new", handleNewMessage);
      socket.off("message:status", handleStatusUpdate);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("error:app", handleAppError);
      socket.disconnect();
    };
  }, [username]);

  const handleSend = useCallback(
    (text) => {
      const tempId = makeTempId();
      const optimisticMessage = {
        id: tempId,
        username,
        text,
        createdAt: new Date().toISOString(),
        status: "sending",
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      socket.emit("message:send", { text, clientTempId: tempId }, (res) => {
        if (!res || !res.success) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, status: "failed" } : m
            )
          );
          setBanner((res && res.error) || "Failed to send message.");
        }
      });
    },
    [username]
  );

  const handleTypingStart = useCallback(() => {
    socket.emit("typing:start");
  }, []);

  const handleTypingStop = useCallback(() => {
    socket.emit("typing:stop");
  }, []);

  if (!username) {
    return <Login onLogin={setUsername} />;
  }

  return (
    <div className="app-layout">
      <UserList
        onlineUsers={onlineUsers}
        currentUsername={username}
        connected={connected}
      />
      <main className="chat-main">
        <header className="chat-header">
          <h2>Realtime Chat</h2>
          <span className="signed-in-as">Signed in as {username}</span>
        </header>
        {banner && (
          <div className="error-banner" onClick={() => setBanner("")}>
            {banner} <span className="dismiss">(dismiss)</span>
          </div>
        )}
        {loadingHistory ? (
          <p className="empty-state">Loading chat history...</p>
        ) : (
          <ChatWindow
            messages={messages}
            username={username}
            typingUsers={typingUsers.filter((u) => u !== username)}
            onSend={handleSend}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
          />
        )}
      </main>
    </div>
  );
}
