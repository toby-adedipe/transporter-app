import React, { useMemo } from 'react';
import { View, SectionList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, StatusBadge, SkeletonLoader, EmptyState } from '@/components/ui';
import { VisibilityFilters } from '@/features/visibility/VisibilityFilters';
import { useVisibilityFilter } from '@/features/visibility/useVisibilityFilter';
import { mapTruckStatus, formatStatus } from '@/features/visibility/utils';
import { useGetTruckVisibilityQuery } from '@/store/api/visibilityApi';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface TimeRangeItem {
  timeRange: string;
  count: number;
  data?: any[];
}

interface TruckStatusGroup {
  truckStatus: string;
  timeRanges: TimeRangeItem[];
}

export default function TruckVisibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const filter = useVisibilityFilter();
  const { data, isLoading, isFetching, refetch } = useGetTruckVisibilityQuery(
    filter,
    { skip: !filter.transporterSapId?.[0] },
  );

  const rawItems: any[] = Array.isArray(data?.result) ? data.result : [];

  const sections = useMemo(() => {
    return rawItems.map((group: TruckStatusGroup) => {
      const totalCount = (group.timeRanges ?? []).reduce(
        (sum: number, tr: TimeRangeItem) => sum + (tr.count ?? 0),
        0,
      );
      return {
        truckStatus: group.truckStatus ?? 'UNKNOWN',
        totalCount,
        data: group.timeRanges ?? [],
      };
    });
  }, [rawItems]);

  const renderSectionHeader = ({ section }: { section: { truckStatus: string; totalCount: number } }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.row}>
        <StatusBadge
          label={formatStatus(section.truckStatus)}
          status={mapTruckStatus(section.truckStatus)}
        />
        <Text style={styles.totalCount}>{section.totalCount} trucks</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: TimeRangeItem }) => (
    <Card variant="default" padding="base">
      <View style={styles.row}>
        <Text style={styles.timeRange}>{formatStatus(item.timeRange)}</Text>
        <Text style={styles.count}>{item.count}</Text>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Truck Visibility</Text>
        <View style={{ width: 32 }} />
      </View>
      <VisibilityFilters />
      {isLoading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} width="100%" height={80} />
          ))}
        </View>
      ) : sections.length === 0 ? (
        <EmptyState icon="bus-outline" title="No trucks found" subtitle="Try adjusting your filters" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.timeRange}-${index}`}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  list: { padding: spacing.base, gap: spacing.sm },
  skeletons: { padding: spacing.base, gap: spacing.md },
  sectionHeader: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCount: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  timeRange: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary },
  count: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.primary },
});
