import React, { useState, useMemo } from 'react';
import { FlatList, RefreshControl, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TruckCard } from './TruckCard';
import { SearchBar, SkeletonLoader, EmptyState } from '@/components/ui';
import { useGetAllAssetsQuery } from '@/store/api/fleetApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { colors, spacing } from '@/constants/theme';

export function FleetList() {
  const router = useRouter();
  const transporterNumber = useAppSelector((s) => s.auth.user?.transporterNumber ?? '');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isFetching, refetch } = useGetAllAssetsQuery(
    { transporterNumber },
    { skip: !transporterNumber },
  );

  const allTrucks: any[] = Array.isArray(data?.data) ? data.data : [];

  const filteredTrucks = useMemo(() => {
    if (!searchQuery) return allTrucks;
    const q = searchQuery.toLowerCase();
    return allTrucks.filter((t: any) =>
      (t.truckPlate ?? t.registrationNumber ?? '').toLowerCase().includes(q) ||
      (t.status ?? '').toLowerCase().includes(q),
    );
  }, [allTrucks, searchQuery]);

  if (isLoading) {
    return (
      <View style={styles.skeletons}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} width="100%" height={80} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by plate..." />
      </View>
      <FlatList
        data={filteredTrucks}
        keyExtractor={(item, index) => item.truckPlate ?? item.id?.toString() ?? String(index)}
        renderItem={({ item }) => (
          <TruckCard
            truckPlate={item.truckPlate ?? item.registrationNumber}
            truckType={item.truckType}
            status={item.status ?? item.truckStatus}
            location={item.location ?? item.locationCategory}
            onPress={() => router.push(`/(tabs)/fleet/${encodeURIComponent(item.truckPlate ?? item.registrationNumber ?? '')}` as any)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="car-outline" title="No trucks found" subtitle={searchQuery ? 'Try a different search' : 'No trucks registered'} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrapper: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  list: { padding: spacing.base, gap: spacing.md, paddingTop: 0 },
  skeletons: { padding: spacing.base, gap: spacing.md },
});
