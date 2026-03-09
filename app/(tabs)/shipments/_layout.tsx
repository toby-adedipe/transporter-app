import { Stack } from 'expo-router';

export default function ShipmentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="feedback/index" />
      <Stack.Screen name="feedback/create/[logon]" />
      <Stack.Screen name="feedback/[logon]" />
    </Stack>
  );
}
