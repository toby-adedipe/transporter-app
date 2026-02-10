import { Stack } from 'expo-router';

export default function FleetLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[truckPlate]" />
    </Stack>
  );
}
