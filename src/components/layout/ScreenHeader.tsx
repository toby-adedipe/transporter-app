import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, fontFamily, shadows } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  textContainer: { flex: 1 },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
