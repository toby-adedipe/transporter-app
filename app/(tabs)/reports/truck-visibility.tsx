import React from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, StatusBadge, SkeletonLoader, EmptyState } from '@/components/ui';
import { VisibilityFilters } from '@/features/visibility/VisibilityFilters';
import { useVisibilityFilter } from '@/features/visibility/useVisibilityFilter';
import { mapTruckStatus, formatStatus } from '@/features/visibility/utils';
import { useGetTruckVisibilityQuery } from '@/store/api/visibilityApi';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function TruckVisibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const filter = useVisibilityFilter();
  const { data, isLoading, isFetching, refetch } = useGetTruckVisibilityQuery(
    filter,
    { skip: !filter.transporterSapId?.[0] },
  );

  const items: any[] = Array.isArray(data?.result) ? data.result : [];

  const renderItem = ({ item }: { item: any }) => (
    <Card variant="default" padding="base">
      <View style={styles.row}>
        <Text style={styles.plate}>{item.truckPlate ?? item.registrationNumber ?? 'N/A'}</Text>
        <StatusBadge label={formatStatus(item.status ?? item.truckStatus)} status={mapTruckStatus(item.status ?? item.truckStatus)} />
      </View>
      <Text style={styles.detail}>Location: {item.location ?? item.locationCategory ?? 'N/A'}</Text>
      <Text style={styles.detail}>Duration: {item.duration ?? item.daysStationary ?? 'N/A'}</Text>
      {item.transporterName && <Text style={styles.detail}>Transporter: {item.transporterName}</Text>}
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
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => item.truckPlate ?? item.id?.toString() ?? String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="bus-outline" title="No trucks found" subtitle="Try adjusting your filters" />}
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
  list: { padding: spacing.base, gap: spacing.md },
  skeletons: { padding: spacing.base, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  plate: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
