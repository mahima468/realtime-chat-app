import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import ChatScreen from "./src/screens/ChatScreen";
import Header from "./src/components/Header";
import { fetchMessageHistory } from "./src/api/api";
import { socket } from "./src/socket/socket";
import { colors } from "./src/theme/colors";

const USERNAME_STORAGE_KEY = "chat:username";

function makeTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

function MainApp() {
  const [username, setUsername] = useState(null);
  const [checkingStoredUser, setCheckingStoredUser] = useState(true);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [banner, setBanner] = useState("");

  const usernameRef = useRef(username);
  usernameRef.current = username;

  // Restore a previously "logged in" username so the user doesn't have to
  // re-enter it every time they open the app (cleared on sign out).
  useEffect(() => {
    AsyncStorage.getItem(USERNAME_STORAGE_KEY)
      .then((stored) => {
        if (stored) setUsername(stored);
      })
      .finally(() => setCheckingStoredUser(false));
  }, []);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    fetchMessageHistory()
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setBanner("Could not load chat history from the server.");
      });

    socket.connect();
    socket.emit("user:join", username);

    function handleConnect() {
      setConnected(true);
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
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    }
    function handleTypingUpdate({ username: who, isTyping }) {
      setTypingUsers((prev) => {
        if (isTyping) return prev.includes(who) ? prev : [...prev, who];
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

  const handleLogin = useCallback((name) => {
    AsyncStorage.setItem(USERNAME_STORAGE_KEY, name).catch(() => {});
    setUsername(name);
  }, []);

  const handleSignOut = useCallback(() => {
    AsyncStorage.removeItem(USERNAME_STORAGE_KEY).catch(() => {});
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    setBanner("");
    setUsername(null);
  }, []);

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
            prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
          );
          setBanner((res && res.error) || "Failed to send message.");
        }
      });
    },
    [username]
  );

  const handleTypingStart = useCallback(() => socket.emit("typing:start"), []);
  const handleTypingStop = useCallback(() => socket.emit("typing:stop"), []);

  if (checkingStoredUser) {
    return <View style={styles.blank} />;
  }

  if (!username) {
    return (
      <SafeAreaView style={styles.safeAreaLogin}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Header
          username={username}
          connected={connected}
          onlineCount={onlineUsers.length}
          onSignOut={handleSignOut}
        />
        {!!banner && (
          <TouchableOpacity style={styles.banner} onPress={() => setBanner("")}>
            <Text style={styles.bannerText}>{banner} (tap to dismiss)</Text>
          </TouchableOpacity>
        )}
        <ChatScreen
          messages={messages}
          username={username}
          typingUsers={typingUsers.filter((u) => u !== username)}
          onSend={handleSend}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  safeAreaLogin: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  blank: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    backgroundColor: "rgba(231, 76, 60, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerText: {
    color: colors.danger,
    fontSize: 12,
  },
});
