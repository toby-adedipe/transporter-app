import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, fontFamily, spacing } from '@/constants/theme';

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
}

const TONE_STYLES: Record<StatusTone, { backgroundColor: string; color: string; borderColor: string }> = {
  success: { backgroundColor: colors.successLight, color: colors.success, borderColor: '#D0E4D8' },
  warning: { backgroundColor: colors.warningLight, color: colors.warning, borderColor: '#E8DCC4' },
  danger: { backgroundColor: colors.dangerLight, color: colors.danger, borderColor: '#E4CCC9' },
  neutral: { backgroundColor: colors.surfaceSecondary, color: colors.textSecondary, borderColor: colors.border },
};

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  const toneStyle = TONE_STYLES[tone];

  return (
    <View style={[styles.container, { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor }]}>
      <Text style={[styles.label, { color: toneStyle.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.3,
  },
});
