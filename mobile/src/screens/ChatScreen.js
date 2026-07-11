import { useEffect, useRef } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import TypingIndicator from "../components/TypingIndicator";
import { colors } from "../theme/colors";

export default function ChatScreen({
  messages,
  username,
  typingUsers,
  onSend,
  onTypingStart,
  onTypingStop,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwnMessage={item.username === username} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyState}>No messages yet. Say hello!</Text>
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      <TypingIndicator typingUsers={typingUsers} />
      <MessageInput
        onSend={onSend}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyState: {
    textAlign: "center",
    marginTop: 40,
    color: colors.textDim,
  },
});
