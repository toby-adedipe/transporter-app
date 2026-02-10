import React from 'react';
import { FlatList, RefreshControl, View, Text, StyleSheet } from 'react-native';
import { Card, StatusBadge, SkeletonLoader, EmptyState } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { formatStatus } from '@/features/visibility/utils';
import { useGetEscalatedTasksQuery } from '@/store/api/shipmentsApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export function EscalatedTasksList() {
  const transporterNumber = useAppSelector((s) => s.auth.user?.transporterNumber ?? '');
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);

  const { data, isLoading, isFetching, isError, refetch } = useGetEscalatedTasksQuery(
    {
      createdDateStart: startDate,
      createdDateEnd: endDate,
      transporterSapIds: transporterNumber ? [transporterNumber] : undefined,
    },
    { skip: !transporterNumber },
  );

  const items: any[] = Array.isArray(data?.data) ? data.data : [];

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
    return <ErrorView message="Failed to load escalated tasks" onRetry={refetch} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) => item.id?.toString() ?? String(index)}
      renderItem={({ item }) => (
        <Card variant="default" padding="base">
          <View style={styles.topRow}>
            <Text style={styles.type}>{formatStatus(item.escalationType ?? item.type)}</Text>
            <StatusBadge
              label={item.isResolved ? 'Resolved' : 'Open'}
              status={item.isResolved ? 'success' : 'danger'}
            />
          </View>
          {item.truckPlate && <Text style={styles.detail}>Truck: {item.truckPlate}</Text>}
          {item.logon && <Text style={styles.detail}>Logon: {item.logon}</Text>}
          {item.isPriority && <Text style={styles.priority}>Priority</Text>}
          {item.createdDate && <Text style={styles.date}>{item.createdDate}</Text>}
        </Card>
      )}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
      ListEmptyComponent={<EmptyState icon="alert-circle-outline" title="No escalations" subtitle="No escalated tasks for this period" />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.base, gap: spacing.md },
  skeletons: { padding: spacing.base, gap: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  type: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary, flex: 1 },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  priority: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.danger, marginTop: spacing.xs },
  date: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: spacing.xs },
});
