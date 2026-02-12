import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Today's Shipments",
    icon: 'cube-outline',
    route: '/(tabs)/shipments',
  },
  {
    label: 'Fleet',
    icon: 'car-outline',
    route: '/(tabs)/fleet',
  },
  {
    label: 'Reports',
    icon: 'bar-chart-outline',
    route: '/(tabs)/reports',
  },
  {
    label: 'Escalated',
    icon: 'warning-outline',
    route: '/(tabs)/shipments',
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(action.route as never)}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={action.icon}
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  scrollContent: {
    gap: spacing.md,
  },
  card: {
    width: 100,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
