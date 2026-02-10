import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
}

const statusColorMap: Record<StatusType, { bg: string; text: string; dot: string }> = {
  success: {
    bg: colors.successLight,
    text: colors.success,
    dot: colors.success,
  },
  warning: {
    bg: colors.warningLight,
    text: colors.warning,
    dot: colors.warning,
  },
  danger: {
    bg: colors.dangerLight,
    text: colors.danger,
    dot: colors.danger,
  },
  info: {
    bg: colors.primaryLight,
    text: colors.primary,
    dot: colors.primary,
  },
  neutral: {
    bg: colors.surfaceSecondary,
    text: colors.textSecondary,
    dot: colors.textTertiary,
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colorSet = statusColorMap[status];

  return (
    <View style={[styles.container, { backgroundColor: colorSet.bg }]}>
      <View style={[styles.dot, { backgroundColor: colorSet.dot }]} />
      <Text style={[styles.label, { color: colorSet.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
