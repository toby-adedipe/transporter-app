import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { FleetList } from '@/features/fleet/FleetList';
import { colors } from '@/constants/theme';

export default function FleetIndexScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Fleet"
        subtitle="Monitor your trucks"
      />
      <FleetList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
