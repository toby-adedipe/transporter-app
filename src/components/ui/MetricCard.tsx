import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, fontFamily, borderRadius, shadows } from '@/constants/theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  accentColor?: string;
  style?: ViewStyle;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  accentColor = colors.primary,
  style,
}: MetricCardProps) {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={styles.value}>{value}</Text>
        {(subtitle || trend !== undefined) && (
          <View style={styles.footer}>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            {trend !== undefined && (
              <Text
                style={[
                  styles.trend,
                  { color: trendPositive ? colors.success : colors.danger },
                ]}
              >
                {trendPositive ? '+' : ''}
                {trend}%
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  accentBar: {
    height: 4,
  },
  content: {
    padding: spacing.base,
  },
  title: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  trend: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
});
