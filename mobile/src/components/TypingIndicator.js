import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) {
    return <View style={styles.placeholder} />;
  }

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.join(", ")} are typing...`;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 20,
  },
  container: {
    height: 20,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  text: {
    fontSize: 12,
    color: colors.textDim,
    fontStyle: "italic",
  },
});
