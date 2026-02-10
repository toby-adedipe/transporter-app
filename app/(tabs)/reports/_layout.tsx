import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="truck-visibility" />
      <Stack.Screen name="customer-visibility" />
      <Stack.Screen name="depot-visibility" />
      <Stack.Screen name="location-visibility" />
      <Stack.Screen name="no-go-zone" />
    </Stack>
  );
}
