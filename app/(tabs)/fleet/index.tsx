import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { FleetList } from '@/features/fleet/FleetList';
import { FleetMap } from '@/features/fleet/FleetMap';
import { colors } from '@/constants/theme';

export default function FleetIndexScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Fleet"
        subtitle="Monitor your trucks"
        rightAction={
          <TouchableOpacity onPress={() => setViewMode((v) => (v === 'list' ? 'map' : 'list'))}>
            <Ionicons
              name={viewMode === 'list' ? 'map-outline' : 'list-outline'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        }
      />
      {viewMode === 'list' ? <FleetList /> : <FleetMap />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
