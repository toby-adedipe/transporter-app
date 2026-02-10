import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, StatusBadge } from '@/components/ui';
import { mapTruckStatus, formatStatus } from '@/features/visibility/utils';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

interface ShipmentCardProps {
  logon?: string;
  truckPlate?: string;
  status?: string;
  origin?: string;
  destination?: string;
  dispatchDate?: string;
  onPress?: () => void;
}

export function ShipmentCard({
  logon, truckPlate, status, origin, destination, dispatchDate, onPress,
}: ShipmentCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress}>
      <Card variant="default" padding="base">
        <View style={styles.topRow}>
          <Text style={styles.logon}>{logon ?? 'N/A'}</Text>
          <StatusBadge label={formatStatus(status)} status={mapTruckStatus(status)} />
        </View>
        {truckPlate && <Text style={styles.detail}>Truck: {truckPlate}</Text>}
        {(origin || destination) && (
          <View style={styles.routeRow}>
            <Text style={styles.route} numberOfLines={1}>{origin ?? 'N/A'}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textTertiary} style={styles.arrow} />
            <Text style={styles.route} numberOfLines={1}>{destination ?? 'N/A'}</Text>
          </View>
        )}
        {dispatchDate && <Text style={styles.date}>Dispatched: {dispatchDate}</Text>}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logon: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  detail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  route: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  arrow: {
    marginHorizontal: spacing.xs,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
