import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ShipmentCard } from './ShipmentCard';
import { SkeletonLoader, EmptyState } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { useGetAllShipmentsQuery } from '@/store/api/shipmentsApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing } from '@/constants/theme';

export function ShipmentList() {
  const router = useRouter();
  const transporterSapId = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useGetAllShipmentsQuery(
    { startDate, endDate, transporterSapId, page, limit: 20, region: 'ALL', status: 'ALL' },
    { skip: !transporterSapId },
  );

  const resultObj = data?.result as any;
  const items: any[] = Array.isArray(resultObj?.content) ? resultObj.content : Array.isArray(resultObj) ? resultObj : [];

  const handleLoadMore = useCallback(() => {
    if (items.length >= 20 * page) {
      setPage((p) => p + 1);
    }
  }, [items.length, page]);

  if (isLoading) {
    return (
      <View style={styles.skeletons}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} width="100%" height={100} />
        ))}
      </View>
    );
  }

  if (isError) {
    return <ErrorView message="Failed to load shipments" onRetry={refetch} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) => item.shipmentNumber ?? item.logon ?? String(index)}
      renderItem={({ item }) => {
        const logon = item.logon ?? item.shipmentNumber;
        const canViewFeedback = Boolean(logon);

        return (
          <ShipmentCard
            logon={logon}
            truckPlate={item.truckPlate}
            status={item.shipmentStatus ?? item.leadTimeSla}
            origin={item.plant}
            destination={item.customerName}
            dispatchDate={item.dispatchDate ? new Date(item.dispatchDate).toLocaleDateString() : undefined}
            onViewFeedback={
              canViewFeedback
                ? () =>
                    router.push(
                      `/(tabs)/shipments/feedback/${encodeURIComponent(logon)}` as any,
                    )
                : undefined
            }
            feedbackDisabled={!canViewFeedback}
            feedbackDisabledReason={
              canViewFeedback
                ? undefined
                : 'Feedback details unavailable: missing logon identifier.'
            }
          />
        );
      }}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<EmptyState icon="cube-outline" title="No shipments" subtitle="No shipments found for this period" />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.base, gap: spacing.md },
  skeletons: { padding: spacing.base, gap: spacing.md },
});
