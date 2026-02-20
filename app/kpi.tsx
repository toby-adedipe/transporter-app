import React from 'react';
import { Redirect } from 'expo-router';

export default function LegacyKpiRouteRedirect() {
  return <Redirect href="/(tabs)/kpi" />;
}
