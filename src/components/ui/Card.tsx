import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

type SpacingKey = keyof typeof spacing;

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: SpacingKey;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'default',
  padding = 'base',
  style,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { padding: spacing[padding] },
        styles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  default: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  elevated: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
});
