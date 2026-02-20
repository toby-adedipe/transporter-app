import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, fontFamily, spacing } from '@/constants/theme';

interface InsightCardProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function InsightCard({ title, subtitle, children, style }: InsightCardProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.base,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
