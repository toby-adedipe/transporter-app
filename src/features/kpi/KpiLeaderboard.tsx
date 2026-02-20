import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card, SkeletonLoader, EmptyState } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { useGetKpiLeaderboardQuery } from '@/store/api/kpiApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing, fontSize, fontWeight, fontFamily, borderRadius } from '@/constants/theme';
import type { KpiLeaderboardEntry } from '@/types/api';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function KpiLeaderboard() {
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading, isError, refetch } = useGetKpiLeaderboardQuery(
    { kpiType: 'AVERAGE_SCORE_CARD', startDate, endDate, top: 10 },
  );

  const leaderboardResult = data?.result;
  const entries: KpiLeaderboardEntry[] = Array.isArray(leaderboardResult)
    ? leaderboardResult
    : Array.isArray(leaderboardResult?.leaderboard)
      ? leaderboardResult.leaderboard
      : [];

  if (isLoading) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>Leaderboard</Text>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} width="100%" height={44} style={{ marginBottom: spacing.sm }} />
        ))}
      </Card>
    );
  }

  if (isError) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>Leaderboard</Text>
        <ErrorView message="Failed to load leaderboard" onRetry={refetch} />
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card variant="default" padding="base">
        <Text style={styles.title}>Leaderboard</Text>
        <EmptyState icon="trophy-outline" title="No rankings yet" subtitle="Leaderboard data will appear here" />
      </Card>
    );
  }

  return (
    <Card variant="default" padding="base">
      <Text style={styles.title}>Leaderboard</Text>
      {entries.map((entry, index) => {
        const isCurrentUser = entry.transporterNumber === transporterNumber;
        const rank = entry.rank ?? index + 1;
        return (
          <View key={entry.transporterNumber ?? index} style={[styles.row, isCurrentUser && styles.rowHighlight]}>
            <View style={[styles.rankBadge, rank <= 3 && { backgroundColor: MEDAL_COLORS[rank - 1] }]}>
              <Text style={[styles.rankText, rank <= 3 && { color: '#fff' }]}>{rank}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, isCurrentUser && styles.nameHighlight]} numberOfLines={1}>
                {entry.transporterName ?? entry.transporterNumber ?? 'N/A'}
              </Text>
              {isCurrentUser && <Text style={styles.youLabel}>You</Text>}
            </View>
            <Text style={styles.score}>{entry.metricValue ?? '-'}</Text>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowHighlight: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: -spacing.base,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    borderBottomWidth: 0,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  info: { flex: 1 },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  nameHighlight: {
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  youLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
  score: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
});
