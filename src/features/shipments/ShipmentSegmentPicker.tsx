import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export type ShipmentSegment = 'all' | 'reroutings' | 'diversions';

interface Props {
  selected: ShipmentSegment;
  onSelect: (segment: ShipmentSegment) => void;
  counts?: Partial<Record<ShipmentSegment, number>>;
}

const segments: { key: ShipmentSegment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reroutings', label: 'Rerouted' },
  { key: 'diversions', label: 'Diverted' },
];

export function ShipmentSegmentPicker({ selected, onSelect, counts }: Props) {
  return (
    <View style={styles.container}>
      {segments.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.segment, selected === key && styles.segmentActive]}
          onPress={() => onSelect(key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, selected === key && styles.labelActive]}>
            {label}
            {counts?.[key] != null ? ` (${counts[key]})` : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: 3,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
