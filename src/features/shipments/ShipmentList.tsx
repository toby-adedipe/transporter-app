import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, View, StyleSheet } from 'react-native';
import { ShipmentCard } from './ShipmentCard';
import { SkeletonLoader, EmptyState } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { useGetAllShipmentsQuery } from '@/store/api/shipmentsApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing } from '@/constants/theme';

export function ShipmentList() {
  const transporterSapId = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((s) => s.filters.dateRange);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useGetAllShipmentsQuery(
    { startDate, endDate, transporterSapId, page, limit: 20 },
    { skip: !transporterSapId },
  );

  const items: any[] = Array.isArray(data?.result) ? data.result : [];

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
      keyExtractor={(item, index) => item.logonOrderNumber ?? item.id?.toString() ?? String(index)}
      renderItem={({ item }) => (
        <ShipmentCard
          logon={item.logonOrderNumber ?? item.logon}
          truckPlate={item.truckPlate ?? item.registrationNumber}
          status={item.status ?? item.shipmentStatus}
          origin={item.origin ?? item.plantName}
          destination={item.destination ?? item.customerName}
          dispatchDate={item.dispatchDate ?? item.createdDate}
        />
      )}
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
