import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

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
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
  },
  content: {
    padding: spacing.base,
  },
  title: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  trend: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
