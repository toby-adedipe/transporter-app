import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, SkeletonLoader, EmptyState } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { useGetTransporterAssetsQuery } from '@/store/api/fleetApi';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export default function TruckDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { truckPlate } = useLocalSearchParams<{ truckPlate: string }>();
  const transporterNumber = useTransporterNumber();

  const { data, isLoading, isError, refetch, isFetching } = useGetTransporterAssetsQuery(
    {
      transporterNumber: transporterNumber!,
      page: 0,
      size: 1000,
    },
    { skip: !truckPlate || !transporterNumber },
  );

  const resultData = data?.result as any;
  const allTrucks: any[] = Array.isArray(resultData?.content)
    ? resultData.content
    : Array.isArray(resultData)
      ? resultData
      : [];
  const truck = allTrucks.find((t: any) => t.registrationNumber === truckPlate);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Truck Details</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <>
            <SkeletonLoader width="100%" height={100} style={{ marginBottom: spacing.base }} />
            <SkeletonLoader width="100%" height={200} />
          </>
        ) : isError ? (
          <ErrorView message="Failed to load truck details" onRetry={refetch} />
        ) : !truck ? (
          <EmptyState icon="car-outline" title="Truck not found" subtitle="No details available for this truck" />
        ) : (
          <>
            <Card variant="elevated" padding="base">
              <Text style={styles.plateLabel}>Registration Number</Text>
              <Text style={styles.plateValue}>{truck.registrationNumber ?? truckPlate}</Text>

              {truck.status && (
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(truck.status) }]} />
                  <Text style={styles.statusText}>{truck.status}</Text>
                </View>
              )}
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Truck Information</Text>
              <View style={styles.infoGrid}>
                {truck.truckType && <InfoRow label="Type" value={truck.truckType} />}
                {truck.make && <InfoRow label="Make" value={truck.make} />}
                {truck.model && <InfoRow label="Model" value={truck.model} />}
                {truck.capacity && <InfoRow label="Capacity" value={`${truck.capacity} tons`} />}
                {truck.transporterName && <InfoRow label="Transporter" value={truck.transporterName} />}
                {truck.driverName && <InfoRow label="Driver" value={truck.driverName} />}
                {truck.driverPhone && <InfoRow label="Driver Phone" value={truck.driverPhone} />}
              </View>
            </Card>

            {truck.lastLocation && (
              <Card variant="default" padding="base">
                <Text style={styles.sectionTitle}>Last Location</Text>
                <View style={styles.infoGrid}>
                  {truck.lastLocation.address && <InfoRow label="Address" value={truck.lastLocation.address} />}
                  {truck.lastLocation.timestamp && (
                    <InfoRow label="Last Updated" value={new Date(truck.lastLocation.timestamp).toLocaleString()} />
                  )}
                </View>
              </Card>
            )}

            {truck.backhaulStatus && (
              <Card variant="default" padding="base">
                <Text style={styles.sectionTitle}>Backhaul Status</Text>
                <Text style={styles.statusText}>{truck.backhaulStatus}</Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: string): string {
  const statusUpper = status.toUpperCase();
  if (statusUpper.includes('ACTIVE') || statusUpper.includes('TRANSIT')) return colors.success;
  if (statusUpper.includes('IDLE') || statusUpper.includes('PARKED')) return colors.textSecondary;
  if (statusUpper.includes('MAINTENANCE')) return colors.danger;
  if (statusUpper.includes('REROUTED')) return colors.warning;
  return colors.primary;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  content: { padding: spacing.base, gap: spacing.base, paddingBottom: spacing['3xl'] },
  plateLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  plateValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
});
