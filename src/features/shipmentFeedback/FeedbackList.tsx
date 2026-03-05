import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, EmptyState, SkeletonLoader, StatusBadge } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useAppSelector } from '@/hooks/useAppSelector';
import { mapShipmentFeedbackList } from '@/features/shipmentFeedback/mapper';
import { useSearchFeedbackQuery } from '@/store/api/shipmentFeedbackApi';
import type { ShipmentFeedbackRecord } from '@/types/api';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';

const PAGE_SIZE = 20;

const safeFormatDate = (value?: string): string => {
  if (!value) return 'N/A';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString();
};

const toRatingStatus = (rating?: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  const normalized = rating?.toUpperCase();
  if (normalized === 'GREEN') return 'success';
  if (normalized === 'AMBER') return 'warning';
  if (normalized === 'RED') return 'danger';
  return 'neutral';
};

export function FeedbackList() {
  const router = useRouter();
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((state) => state.filters.dateRange);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ShipmentFeedbackRecord[]>([]);

  const { data, isLoading, isFetching, isError, refetch } = useSearchFeedbackQuery(
    {
      transporterNumber,
      feedbackDateStart: startDate,
      feedbackDateEnd: endDate,
      page,
      size: PAGE_SIZE,
    },
    { skip: !transporterNumber },
  );

  const listResult = useMemo(() => mapShipmentFeedbackList(data), [data]);

  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [endDate, startDate, transporterNumber]);

  useEffect(() => {
    if (!data) return;

    setItems((previous) => {
      if (page === 0) return listResult.items;

      const merged = [...previous];
      for (const item of listResult.items) {
        const key = item.id?.toString() ?? item.logon ?? item.shipmentNumber;
        if (!key) {
          merged.push(item);
          continue;
        }

        const exists = merged.some((existing) => {
          const existingKey =
            existing.id?.toString() ?? existing.logon ?? existing.shipmentNumber;
          return existingKey === key;
        });

        if (!exists) merged.push(item);
      }
      return merged;
    });
  }, [data, listResult.items, page]);

  const canLoadMore =
    listResult.totalPages > 0 &&
    page + 1 < listResult.totalPages &&
    items.length >= PAGE_SIZE;

  const handleLoadMore = useCallback(() => {
    if (canLoadMore && !isFetching) {
      setPage((current) => current + 1);
    }
  }, [canLoadMore, isFetching]);

  if (isLoading) {
    return (
      <View style={styles.skeletons}>
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonLoader key={index} width="100%" height={112} />
        ))}
      </View>
    );
  }

  if (isError) {
    return <ErrorView message="Failed to load feedback history" onRetry={refetch} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) =>
        item.id?.toString() ?? item.logon ?? item.shipmentNumber ?? String(index)
      }
      renderItem={({ item }) => {
        const logonOrShipment = item.logon ?? item.shipmentNumber;
        const canOpen = Boolean(logonOrShipment);

        return (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!canOpen}
            onPress={() => {
              if (!logonOrShipment) return;
              router.push(
                `/(tabs)/shipments/feedback/${encodeURIComponent(logonOrShipment)}` as any,
              );
            }}
          >
            <Card variant="default" padding="base">
              <View style={styles.topRow}>
                <Text style={styles.title}>{logonOrShipment ?? 'Unknown Logon'}</Text>
                <StatusBadge
                  label={(item.driverArrivalRating ?? 'Unknown').toUpperCase()}
                  status={toRatingStatus(item.driverArrivalRating)}
                />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Shipment: {item.shipmentNumber ?? 'N/A'}
                </Text>
                <Text style={styles.metaText}>
                  Date: {safeFormatDate(item.feedbackDate)}
                </Text>
              </View>

              <Text numberOfLines={2} style={styles.bodyText}>
                {item.driverFeedbackText ?? item.otherInformationText ?? 'No feedback notes'}
              </Text>

              {!canOpen ? (
                <Text style={styles.hint}>Feedback details unavailable: missing logon identifier.</Text>
              ) : null}
            </Card>
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={styles.list}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={() => {
            setPage(0);
            refetch();
          }}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="No feedback records"
          subtitle="No driver feedback was found for this date range"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.base,
    gap: spacing.md,
  },
  skeletons: {
    padding: spacing.base,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  metaRow: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bodyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.warning,
  },
});
