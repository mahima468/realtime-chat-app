import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

export default function Header({ username, connected, onlineCount, onSignOut }) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.title}>Realtime Chat</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: connected ? colors.online : colors.offline },
            ]}
          />
          <Text style={styles.statusText}>
            {connected ? `Online \u00b7 ${onlineCount} active` : "Reconnecting..."}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.signOut} onPress={onSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  left: {
    flexShrink: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.textDim,
  },
  signOut: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
});
