import { useMemo } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import type { VisibilityFilterDto } from '@/types/api';

export function useVisibilityFilter(
  overrides?: Partial<VisibilityFilterDto>,
): VisibilityFilterDto {
  const transporterNumber = useAppSelector(
    (s) => s.auth.user?.transporterNumber ?? '',
  );
  const { selectedRegion, truckStatusFilter, truckTypeFilter } = useAppSelector(
    (s) => s.filters,
  );

  return useMemo(
    () => ({
      transporterSapId: transporterNumber ? [transporterNumber] : undefined,
      region:
        selectedRegion && selectedRegion !== 'ALL'
          ? [selectedRegion]
          : undefined,
      truckStatus: truckStatusFilter.length > 0 ? truckStatusFilter : undefined,
      truckType: truckTypeFilter.length > 0 ? truckTypeFilter : undefined,
      ...overrides,
    }),
    [transporterNumber, selectedRegion, truckStatusFilter, truckTypeFilter, overrides],
  );
}
