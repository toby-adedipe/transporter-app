import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface ReportType {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const REPORT_TYPES: ReportType[] = [
  {
    key: 'truck',
    title: 'Truck Visibility',
    description: 'Track truck status across all locations',
    icon: 'bus-outline',
    route: '/(tabs)/reports/truck-visibility',
  },
  {
    key: 'customer',
    title: 'Customer Visibility',
    description: 'Trucks at customer sites',
    icon: 'people-outline',
    route: '/(tabs)/reports/customer-visibility',
  },
  {
    key: 'depot',
    title: 'Depot Visibility',
    description: 'Trucks at depot locations',
    icon: 'business-outline',
    route: '/(tabs)/reports/depot-visibility',
  },
  {
    key: 'location',
    title: 'Location Visibility',
    description: 'Visibility by location category',
    icon: 'location-outline',
    route: '/(tabs)/reports/location-visibility',
  },
  {
    key: 'nogozone',
    title: 'No-Go Zone',
    description: 'Trucks in restricted areas',
    icon: 'warning-outline',
    route: '/(tabs)/reports/no-go-zone',
  },
];

export default function ReportsIndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reports" subtitle="Visibility & analytics" />
      <ScrollView contentContainerStyle={styles.content}>
        {REPORT_TYPES.map((report) => (
          <TouchableOpacity
            key={report.key}
            activeOpacity={0.7}
            onPress={() => router.push(report.route as never)}
          >
            <Card variant="default" padding="base" style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name={report.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{report.title}</Text>
                  <Text style={styles.cardDescription}>{report.description}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.base,
    gap: spacing.md,
  },
  card: {
    marginBottom: 0,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
