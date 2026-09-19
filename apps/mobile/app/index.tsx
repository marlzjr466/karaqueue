import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>PHASE 1 · DATABASE & AUTH</Text>
      <Text style={styles.title}>KaraQueue</Text>
      <Text style={styles.subtitle}>
        Your songs. Your queue. Your stage. Search, queue, and player screens arrive in
        later phases.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05030a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  eyebrow: {
    color: "#2ee8ff",
    letterSpacing: 3,
    fontSize: 12,
    marginBottom: 12
  },
  title: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 12
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    textAlign: "center"
  }
});
