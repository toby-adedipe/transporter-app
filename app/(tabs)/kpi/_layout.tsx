import { Stack } from 'expo-router';

export default function KpiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="revenue-simulator" />
    </Stack>
  );
}
