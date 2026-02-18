import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import { KpiBreakdownSummary } from '@/features/kpi/KpiBreakdownSummary';
import { KpiBreakdownTrend } from '@/features/kpi/KpiBreakdownTrend';
import { KpiAiInsights } from '@/features/kpi/KpiAiInsights';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import type { KpiType } from '@/types/api';

const KPI_TYPES: KpiType[] = [
  'DISPATCH_VOLUME',
  'GIGO',
  'CICO_CUSTOMER',
  'BACKHAUL',
  'LEAD_TIME',
  'OTD_RING_1',
  'AVG_DISTANCE_PER_TRIP',
  'TRIPS_PER_TRUCK_PER_WEEK',
  'TI',
  'TO',
  'AVERAGE_SCORE_CARD',
  'AVAILABILITY',
  'TOTAL_TRUCKS',
  'VIOLATION_RATE',
  'SKMD',
  'HRD',
];

export default function KpiBreakdownReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ metricType?: string }>();
  const [selectedMetricName, setSelectedMetricName] = React.useState<string | null>(null);
  const initialKpi = KPI_TYPES.includes(params.metricType as KpiType)
    ? (params.metricType as KpiType)
    : undefined;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>KPI Breakdown</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <KpiBreakdownSummary
          selectedKpi={initialKpi}
          selectedMetricName={selectedMetricName}
          onMetricSelect={setSelectedMetricName}
        />
        <KpiBreakdownTrend selectedKpi={initialKpi} />
        <KpiAiInsights selectedMetricName={selectedMetricName} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.base,
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
});
