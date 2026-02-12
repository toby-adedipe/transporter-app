import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonLoader } from '@/components/ui';
import { useGetAllAssetsQuery } from '@/store/api/fleetApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface FleetMetric {
  label: string;
  count: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function FleetSummary() {
  const transporterNumber = useTransporterNumber();

  const { data, isLoading } = useGetAllAssetsQuery(
    {
      transporterNumber,
    },
    { skip: !transporterNumber },
  );

  const resultData = data?.result as any;
  const trucks: any[] = Array.isArray(resultData?.content)
    ? resultData.content
    : Array.isArray(resultData)
      ? resultData
      : [];

  // Calculate truck statuses
  const active = trucks.filter((t) => t.status === 'ACTIVE' || t.status === 'IN_TRANSIT').length;
  const rerouted = trucks.filter((t) => t.status === 'REROUTED' || t.isRerouted).length;
  const idle = trucks.filter((t) => t.status === 'IDLE' || t.status === 'PARKED').length;
  const maintenance = trucks.filter((t) => t.status === 'MAINTENANCE' || t.status === 'UNDER_MAINTENANCE').length;

  const metrics: FleetMetric[] = [
    { label: 'Active', count: active, color: colors.success, icon: 'checkmark-circle' },
    { label: 'Rerouted', count: rerouted, color: colors.warning, icon: 'swap-horizontal' },
    { label: 'Idle', count: idle, color: colors.textSecondary, icon: 'pause-circle' },
    { label: 'Maintenance', count: maintenance, color: colors.danger, icon: 'construct' },
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Fleet Status</Text>
        </View>
        <View style={styles.metricsContainer}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} width="48%" height={70} />
          ))}
        </View>
      </View>
    );
  }

  if (trucks.length === 0) {
    return null; // Don't show if no data
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fleet Status</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/(tabs)/fleet')}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.totalContainer}>
        <Ionicons name="bus" size={24} color={colors.primary} />
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Total Trucks</Text>
          <Text style={styles.totalValue}>{trucks.length}</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name={metric.icon} size={20} color={metric.color} />
              <Text style={styles.metricCount}>{metric.count}</Text>
            </View>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  totalValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metricCount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
});
