import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { FilterChip } from '@/components/ui';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppSelector';
import { setRegion } from '@/store/slices/filtersSlice';
import { spacing } from '@/constants/theme';
import type { Region } from '@/types/api';

const REGIONS: { label: string; value: Region }[] = [
  { label: 'All Regions', value: 'ALL' },
  { label: 'North', value: 'NORTH' },
  { label: 'West', value: 'WEST' },
  { label: 'East', value: 'EAST' },
  { label: 'Lagos', value: 'LAGOS' },
];

export function VisibilityFilters() {
  const dispatch = useAppDispatch();
  const selectedRegion = useAppSelector((s) => s.filters.selectedRegion);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {REGIONS.map((region) => (
        <FilterChip
          key={region.value}
          label={region.label}
          selected={selectedRegion === region.value}
          onPress={() => dispatch(setRegion(region.value))}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
});
