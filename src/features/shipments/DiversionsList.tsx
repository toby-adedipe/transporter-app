import React from 'react';
import { FlatList, RefreshControl, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, StatusBadge, SkeletonLoader, EmptyState } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { formatStatus } from '@/features/visibility/utils';
import { useGetDiversionsQuery } from '@/store/api/shipmentsApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export function DiversionsList() {
  const transporterNumber = useAppSelector((s) => s.auth.user?.transporterNumber ?? '');
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading, isFetching, isError, refetch } = useGetDiversionsQuery(
    {
      createdDateStart: startDate,
      createdDateEnd: endDate,
      transporters: transporterNumber ? [transporterNumber] : undefined,
    },
    { skip: !transporterNumber },
  );

  const items: any[] = Array.isArray(data?.result) ? data.result : [];

  if (isLoading) {
    return (
      <View style={styles.skeletons}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} width="100%" height={90} />
        ))}
      </View>
    );
  }

  if (isError) {
    return <ErrorView message="Failed to load diversions" onRetry={refetch} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) => item.id?.toString() ?? String(index)}
      renderItem={({ item }) => (
        <Card variant="default" padding="base">
          <View style={styles.topRow}>
            <Text style={styles.logon}>{item.logonNumber ?? item.logon ?? 'N/A'}</Text>
            <StatusBadge label={formatStatus(item.status)} status={item.status?.includes('APPROVED') ? 'success' : item.status?.includes('REJECTED') ? 'danger' : 'warning'} />
          </View>
          <View style={styles.routeRow}>
            <Text style={styles.route} numberOfLines={1}>{item.originalDestination ?? 'N/A'}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textTertiary} style={styles.arrow} />
            <Text style={styles.route} numberOfLines={1}>{item.newDestination ?? 'N/A'}</Text>
          </View>
          {item.reason && <Text style={styles.detail}>Reason: {item.reason}</Text>}
          {item.region && <Text style={styles.detail}>Region: {item.region}</Text>}
        </Card>
      )}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
      ListEmptyComponent={<EmptyState icon="git-branch-outline" title="No diversions" subtitle="No diversion requests for this period" />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.base, gap: spacing.md },
  skeletons: { padding: spacing.base, gap: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  logon: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  route: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1 },
  arrow: { marginHorizontal: spacing.xs },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});
