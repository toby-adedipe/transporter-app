import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SkeletonLoader } from '@/components/ui';
import { useGetOperationalDashboardQuery } from '@/store/api/dashboardApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '@/constants/theme';

interface OperationalMetric {
  key: string;
  label: string;
  thresholds: { green: number; amber: number };
  /** true = higher is better (green above threshold), false = lower is better */
  higherIsBetter: boolean;
}

const OPERATIONAL_METRICS: OperationalMetric[] = [
  {
    key: 'onTimeDeliveryRate',
    label: 'On-Time Delivery',
    thresholds: { green: 90, amber: 75 },
    higherIsBetter: true,
  },
  {
    key: 'truckUtilization',
    label: 'Truck Utilization',
    thresholds: { green: 85, amber: 65 },
    higherIsBetter: true,
  },
  {
    key: 'averageTurnaroundTime',
    label: 'Avg Turnaround (hrs)',
    thresholds: { green: 24, amber: 48 },
    higherIsBetter: false,
  },
  {
    key: 'trackingCompliance',
    label: 'Tracking Compliance',
    thresholds: { green: 95, amber: 80 },
    higherIsBetter: true,
  },
  {
    key: 'loadingEfficiency',
    label: 'Loading Efficiency',
    thresholds: { green: 90, amber: 70 },
    higherIsBetter: true,
  },
];

function getStatusColor(
  value: number,
  thresholds: { green: number; amber: number },
  higherIsBetter: boolean,
): string {
  if (higherIsBetter) {
    if (value >= thresholds.green) return colors.success;
    if (value >= thresholds.amber) return colors.warning;
    return colors.danger;
  }
  // Lower is better (e.g., turnaround time)
  if (value <= thresholds.green) return colors.success;
  if (value <= thresholds.amber) return colors.warning;
  return colors.danger;
}

export function OperationalSummary() {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading } = useGetOperationalDashboardQuery(
    { transporterNumber, startDate, endDate },
    { skip: !transporterNumber },
  );

  const operationalData = data?.result as Record<string, unknown> | undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Operational Summary</Text>

      {isLoading ? (
        <View style={styles.skeletonList}>
          {OPERATIONAL_METRICS.map((m) => (
            <SkeletonLoader
              key={m.key}
              width="100%"
              height={44}
              borderRadius={borderRadius.md}
              style={styles.skeletonItem}
            />
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          {OPERATIONAL_METRICS.map((metric) => {
            const rawValue = operationalData?.[metric.key];
            const numValue = typeof rawValue === 'number' ? rawValue : null;
            const displayValue =
              numValue !== null
                ? metric.key === 'averageTurnaroundTime'
                  ? numValue.toFixed(1)
                  : `${numValue.toFixed(1)}%`
                : '--';

            const indicatorColor =
              numValue !== null
                ? getStatusColor(
                    numValue,
                    metric.thresholds,
                    metric.higherIsBetter,
                  )
                : colors.border;

            return (
              <View key={metric.key} style={styles.row}>
                <View
                  style={[
                    styles.indicator,
                    { backgroundColor: indicatorColor },
                  ]}
                />
                <Text style={styles.label}>{metric.label}</Text>
                <Text style={styles.value}>{displayValue}</Text>
              </View>
            );
          })}
        </View>
      )}
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  skeletonList: {
    gap: spacing.sm,
  },
  skeletonItem: {
    marginBottom: 0,
  },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
});
