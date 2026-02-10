import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
}

export function Badge({
  label,
  color = colors.primary,
  bgColor = colors.primaryLight,
}: BadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
