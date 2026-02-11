import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useGetAllAssetsQuery } from '@/store/api/fleetApi';
import { APP_CONFIG } from '@/constants/config';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { SkeletonLoader } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export function FleetMap() {
  const transporterNumber = useTransporterNumber();

  const { data, isLoading } = useGetAllAssetsQuery(
    { transporterNumber },
    { skip: !transporterNumber, pollingInterval: APP_CONFIG.pollingIntervalMs },
  );

  const trucks: any[] = Array.isArray(data?.result) ? data.result : [];
  const trucksWithLocation = trucks.filter(
    (t: any) => t.latitude != null && t.longitude != null && !isNaN(t.latitude) && !isNaN(t.longitude),
  );

  if (isLoading) {
    return <SkeletonLoader width="100%" height="100%" />;
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={APP_CONFIG.mapDefaultRegion} showsUserLocation>
        {trucksWithLocation.map((truck: any) => (
          <Marker
            key={truck.truckPlate ?? truck.id}
            coordinate={{ latitude: Number(truck.latitude), longitude: Number(truck.longitude) }}
            title={truck.truckPlate ?? truck.registrationNumber}
            description={truck.status ?? truck.truckStatus}
            pinColor={
              (truck.status ?? '').toUpperCase().includes('NOT_TRACKING') ? colors.danger : colors.primary
            }
          />
        ))}
      </MapView>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{trucksWithLocation.length} trucks on map</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  countBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  countText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
});
