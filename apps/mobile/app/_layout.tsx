import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#05030a" },
          headerTintColor: "#ffffff",
          contentStyle: { backgroundColor: "#05030a" }
        }}
      />
    </>
  );
}
