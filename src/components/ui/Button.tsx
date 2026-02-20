import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, fontSize, fontWeight, fontFamily, spacing, borderRadius, shadows } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      borderWidth: 0,
      ...shadows.sm,
    },
    text: {
      color: colors.surface,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 0,
    },
    text: {
      color: colors.textPrimary,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: {
      color: colors.textPrimary,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    text: {
      color: colors.primary,
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    text: {
      fontSize: fontSize.sm,
    },
  },
  md: {
    container: {
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
    },
    text: {
      fontSize: fontSize.base,
    },
  },
  lg: {
    container: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.base,
    },
    text: {
      fontSize: fontSize.lg,
    },
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.surface : colors.primary}
        />
      ) : (
        <Text style={[styles.text, vStyle.text, sStyle.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
});
