import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, StatusBadge } from '@/components/ui';
import { mapTruckStatus, formatStatus } from '@/features/visibility/utils';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

interface TruckCardProps {
  truckPlate?: string;
  truckType?: string;
  status?: string;
  location?: string;
  onPress?: () => void;
}

export function TruckCard({ truckPlate, truckType, status, location, onPress }: TruckCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress}>
      <Card variant="default" padding="base">
        <View style={styles.topRow}>
          <Text style={styles.plate}>{truckPlate ?? 'N/A'}</Text>
          <StatusBadge label={formatStatus(status)} status={mapTruckStatus(status)} />
        </View>
        {truckType && <Text style={styles.detail}>Type: {formatStatus(truckType)}</Text>}
        {location && <Text style={styles.detail}>Location: {location}</Text>}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  plate: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.textPrimary },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
