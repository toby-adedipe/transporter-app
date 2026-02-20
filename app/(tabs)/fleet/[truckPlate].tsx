import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, SkeletonLoader, EmptyState } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { useGetTruckLocationByPlateQuery } from '@/store/api/transporterInsightsApi';
import { useGetTransporterAssetsQuery } from '@/store/api/fleetApi';
import { mapTruckDetailFromSearch } from '@/features/fleet/truckInsightsMapper';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { AI_INSIGHTS_API_KEY } from '@/constants/config';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function TruckDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { truckPlate } = useLocalSearchParams<{ truckPlate: string }>();
  const transporterNumber = useTransporterNumber();
  const requestedPlate = typeof truckPlate === 'string' ? safeDecode(truckPlate) : '';
  const isInsightsConfigured = Boolean(AI_INSIGHTS_API_KEY);

  const {
    data: insightsData,
    isLoading: isInsightsLoading,
    isError: isInsightsError,
    error: insightsError,
    refetch: refetchInsights,
    isFetching: isInsightsFetching,
  } = useGetTruckLocationByPlateQuery(
    {
      plate: requestedPlate,
      transporterNumber: transporterNumber!,
      limit: 5,
    },
    { skip: !requestedPlate || !transporterNumber || !isInsightsConfigured },
  );

  const truckFromInsights = useMemo(
    () => mapTruckDetailFromSearch(insightsData, requestedPlate),
    [insightsData, requestedPlate],
  );

  const shouldFetchLegacyFallback = Boolean(
    requestedPlate &&
      transporterNumber &&
      (!isInsightsConfigured || isInsightsError || !truckFromInsights),
  );

  const {
    data: legacyData,
    isLoading: isLegacyLoading,
    isError: isLegacyError,
    error: legacyError,
    refetch: refetchLegacy,
    isFetching: isLegacyFetching,
  } = useGetTransporterAssetsQuery(
    {
      transporterNumber: transporterNumber!,
      page: 0,
      size: 1000,
    },
    { skip: !shouldFetchLegacyFallback },
  );

  const legacyTruck = useMemo(() => {
    const resultData = legacyData?.result as any;
    const allTrucks: any[] = Array.isArray(resultData?.content)
      ? resultData.content
      : Array.isArray(resultData)
        ? resultData
        : [];
    if (!requestedPlate) return null;

    const normalizedRequestedPlate = requestedPlate.toLowerCase();
    const exact = allTrucks.find((truck: any) => {
      const plate = String(truck?.truckPlate ?? truck?.registrationNumber ?? '')
        .trim()
        .toLowerCase();
      return plate.length > 0 && plate === normalizedRequestedPlate;
    });

    return exact ?? allTrucks[0] ?? null;
  }, [legacyData, requestedPlate]);

  const truckFromLegacy = useMemo(
    () =>
      legacyTruck
        ? mapTruckDetailFromSearch({ result: [legacyTruck] }, requestedPlate)
        : null,
    [legacyTruck, requestedPlate],
  );

  const truck = truckFromInsights ?? truckFromLegacy;
  const isUsingLegacyFallback = !truckFromInsights && Boolean(truckFromLegacy);
  const isLoading = isInsightsLoading || (shouldFetchLegacyFallback && !truckFromInsights && isLegacyLoading);
  const isFetching = isInsightsFetching || (shouldFetchLegacyFallback && isLegacyFetching);
  const hasAnyError = isInsightsError && !truckFromInsights && isLegacyError && !truckFromLegacy;

  const hasShipmentDetails = Boolean(
    truck &&
      (truck.shipment.reference ||
        truck.shipment.status ||
        truck.shipment.origin ||
        truck.shipment.destination ||
        truck.shipment.eta ||
        truck.shipment.customer ||
        truck.shipment.product),
  );

  const hasLocationDetails = Boolean(
    truck &&
      (truck.location.latitude !== undefined ||
        truck.location.longitude !== undefined ||
        truck.location.address ||
        truck.location.updatedAt ||
        truck.location.status),
  );

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
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              if (isInsightsConfigured) {
                refetchInsights();
              }
              if (shouldFetchLegacyFallback) {
                refetchLegacy();
              }
            }}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <>
            <SkeletonLoader width="100%" height={100} style={{ marginBottom: spacing.base }} />
            <SkeletonLoader width="100%" height={200} />
            <SkeletonLoader width="100%" height={180} />
          </>
        ) : hasAnyError ? (
          <ErrorView
            message={getFleetDetailsErrorMessage(legacyError ?? insightsError)}
            onRetry={() => {
              if (isInsightsConfigured) refetchInsights();
              if (shouldFetchLegacyFallback) refetchLegacy();
            }}
          />
        ) : !truck ? (
          <EmptyState icon="car-outline" title="No live location found" subtitle={`No truck details found for ${requestedPlate}`} />
        ) : (
          <>
            <Card variant="elevated" padding="base">
              <Text style={styles.plateLabel}>Registration Number</Text>
              <Text style={styles.plateValue}>{truck.plate}</Text>

              {truck.status ? (
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(truck.status) }]} />
                  <Text style={styles.statusText}>{truck.status}</Text>
                </View>
              ) : null}

              {truck.fallbackUsed ? (
                <Text style={styles.fallbackNote}>
                  Exact match was not found for {truck.requestedPlate}. Showing closest live truck result.
                </Text>
              ) : null}

              {isUsingLegacyFallback ? (
                <Text style={styles.legacyNote}>
                  Showing data from fleet assets fallback source while live insights is unavailable.
                </Text>
              ) : null}
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Current Shipment</Text>
              {hasShipmentDetails ? (
                <View style={styles.infoGrid}>
                  {truck.shipment.reference && <InfoRow label="Reference" value={truck.shipment.reference} />}
                  {truck.shipment.status && <InfoRow label="Status" value={truck.shipment.status} />}
                  {truck.shipment.origin && <InfoRow label="Origin" value={truck.shipment.origin} />}
                  {truck.shipment.destination && <InfoRow label="Destination" value={truck.shipment.destination} />}
                  {truck.shipment.customer && <InfoRow label="Customer" value={truck.shipment.customer} />}
                  {truck.shipment.product && <InfoRow label="Product" value={truck.shipment.product} />}
                  {truck.shipment.eta && <InfoRow label="ETA" value={formatTimestamp(truck.shipment.eta)} />}
                </View>
              ) : (
                <Text style={styles.emptyText}>No active shipment details available.</Text>
              )}
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Live Location</Text>
              {hasLocationDetails ? (
                <View style={styles.infoGrid}>
                  {truck.location.latitude !== undefined && truck.location.longitude !== undefined ? (
                    <InfoRow
                      label="Coordinates"
                      value={`${truck.location.latitude.toFixed(6)}, ${truck.location.longitude.toFixed(6)}`}
                    />
                  ) : null}
                  {truck.location.address && <InfoRow label="Address" value={truck.location.address} />}
                  {truck.location.status && <InfoRow label="Status" value={truck.location.status} />}
                  {truck.location.updatedAt && (
                    <InfoRow label="Last Updated" value={formatTimestamp(truck.location.updatedAt)} />
                  )}
                </View>
              ) : (
                <Text style={styles.emptyText}>No location metadata available for this truck.</Text>
              )}
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Movement History</Text>
              {truck.movementHistory.length > 0 ? (
                <View style={styles.timeline}>
                  {truck.movementHistory.map((point, index) => (
                    <View key={`${point.timestamp ?? 'point'}-${index}`} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineBody}>
                        {point.timestamp ? (
                          <Text style={styles.timelineTime}>{formatTimestamp(point.timestamp)}</Text>
                        ) : null}
                        {point.latitude !== undefined && point.longitude !== undefined ? (
                          <Text style={styles.timelineText}>
                            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                          </Text>
                        ) : null}
                        {point.address ? <Text style={styles.timelineText}>{point.address}</Text> : null}
                        {point.status ? <Text style={styles.timelineSubtle}>{point.status}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No movement history available.</Text>
              )}
            </Card>
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

function formatTimestamp(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

function getFleetDetailsErrorMessage(error: unknown): string {
  const fallbackMessage = 'Failed to load truck details';
  if (!error || typeof error !== 'object') return fallbackMessage;

  const typedError = error as any;
  const status = typedError.status ?? typedError.originalStatus;
  const dataMessage =
    typeof typedError?.data?.message === 'string' ? typedError.data.message.trim() : '';
  const dataDetail =
    typeof typedError?.data?.detail === 'string' ? typedError.data.detail.trim() : '';

  if (dataMessage.toLowerCase().includes('not configured')) {
    return 'Truck insights is not configured. Missing AI insights API key.';
  }
  if (dataDetail.toLowerCase().includes('transporternumber') && dataDetail.toLowerCase().includes('claim')) {
    return 'Your login token is missing transporter scope for truck insights.';
  }

  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return 'Truck insights scope mismatch. Please contact support.';
  if (status === 422) return dataMessage || 'Truck details request is invalid.';
  if (status === 500 || status === 502) return 'Truck insights is temporarily unavailable. Please retry.';

  if (dataDetail) return dataDetail;
  if (dataMessage) return dataMessage;
  if (typeof typedError.error === 'string' && typedError.error.trim().length > 0) return typedError.error;
  return fallbackMessage;
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
  fallbackNote: {
    marginTop: spacing.sm,
    color: colors.warning,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  legacyNote: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
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
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
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
  timeline: {
    gap: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  timelineBody: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  timelineTime: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  timelineText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  timelineSubtle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});
