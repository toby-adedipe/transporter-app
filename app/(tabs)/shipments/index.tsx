import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ShipmentSegmentPicker, ShipmentSegment } from '@/features/shipments/ShipmentSegmentPicker';
import { ShipmentList } from '@/features/shipments/ShipmentList';
import { EscalatedTasksList } from '@/features/shipments/EscalatedTasksList';
import { DiversionsList } from '@/features/shipments/DiversionsList';
import { ReroutingsList } from '@/features/shipments/ReroutingsList';
import { colors } from '@/constants/theme';

export default function ShipmentsIndexScreen() {
  const [segment, setSegment] = useState<ShipmentSegment>('all');

  return (
    <View style={styles.container}>
      <ScreenHeader title="Shipments" subtitle="Track and manage deliveries" />
      <ShipmentSegmentPicker selected={segment} onSelect={setSegment} />
      {segment === 'all' && <ShipmentList />}
      {segment === 'escalated' && <EscalatedTasksList />}
      {segment === 'diversions' && <DiversionsList />}
      {segment === 'reroutings' && <ReroutingsList />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
