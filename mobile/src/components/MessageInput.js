import { useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Text, View } from "react-native";
import { colors } from "../theme/colors";

const TYPING_STOP_DELAY_MS = 1500;

export default function MessageInput({ onSend, onTypingStart, onTypingStop }) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef(null);

  function handleChange(value) {
    setText(value);
    onTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(onTypingStop, TYPING_STOP_DELAY_MS);
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onTypingStop();
  }

  return (
    <View style={styles.bar}>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor={colors.textDim}
        value={text}
        onChangeText={handleChange}
        maxLength={2000}
        multiline
      />
      <TouchableOpacity
        style={[styles.button, !text.trim() && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={!text.trim()}
      >
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  button: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
