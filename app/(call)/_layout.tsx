import { Stack } from "expo-router";

export default function CallLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="call_screen"
        options={{
          presentation: "fullScreenModal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="incoming_call_screen"
        options={{
          presentation: "transparentModal",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
