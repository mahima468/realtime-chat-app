import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isOwnMessage }) {
  const { username, text, createdAt, status } = message;

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isOwnMessage ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        {!isOwnMessage && <Text style={styles.author}>{username}</Text>}
        <Text style={isOwnMessage ? styles.textOwn : styles.textOther}>
          {text}
        </Text>
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.meta,
              { color: isOwnMessage ? "rgba(255,255,255,0.75)" : colors.textDim },
            ]}
          >
            {formatTimestamp(createdAt)}
          </Text>
          {isOwnMessage && (
            <Text style={[styles.meta, styles.metaSpacer, { color: "rgba(255,255,255,0.75)" }]}>
              {status === "sending" && "Sending..."}
              {status === "sent" && "Sent"}
              {status === "delivered" && "Delivered"}
              {status === "failed" && "Failed"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 4,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleOwn: {
    backgroundColor: colors.bubbleOwn,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleOther,
    borderBottomLeftRadius: 4,
  },
  author: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  textOwn: {
    fontSize: 15,
    color: colors.bubbleOwnText,
  },
  textOther: {
    fontSize: 15,
    color: colors.bubbleOtherText,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  meta: {
    fontSize: 10,
  },
  metaSpacer: {
    marginLeft: 8,
  },
});
