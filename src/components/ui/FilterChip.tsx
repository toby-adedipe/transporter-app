import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, fontSize, fontWeight, fontFamily, spacing, borderRadius, shadows } from '@/constants/theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected ? styles.selected : styles.unselected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected ? styles.selectedLabel : styles.unselectedLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 1,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  selected: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  label: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.medium,
  },
  selectedLabel: {
    color: colors.surface,
  },
  unselectedLabel: {
    color: colors.textSecondary,
  },
});
