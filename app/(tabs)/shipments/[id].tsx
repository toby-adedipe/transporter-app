import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, SkeletonLoader } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { DriverHosCard } from '@/features/shipmentFeedback/DriverHosCard';
import { getShipmentFeedbackApiErrorMessage } from '@/features/shipmentFeedback/errors';
import {
  hasCompleteShipmentFeedbackContext,
  mapDriverHos,
  mapShipmentFeedback,
  mapShipmentFeedbackContext,
  mergeShipmentFeedbackContext,
} from '@/features/shipmentFeedback/mapper';
import { ShipmentContextCard } from '@/features/shipmentFeedback/ShipmentContextCard';
import { useGetDriverHosQuery } from '@/store/api/driverApi';
import { useGetFeedbackByLogonQuery } from '@/store/api/shipmentFeedbackApi';
import { useGetShipmentsByLogonQuery } from '@/store/api/shipmentsApi';
import type { ShipmentFeedbackShipmentContext } from '@/types/api';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    id,
    shipmentNumber,
    orderStatus,
    shipmentStatus,
    origin,
    destination,
    quantity,
    dispatchDate,
    truckPlate,
  } = useLocalSearchParams<{
    id: string;
    shipmentNumber?: string;
    orderStatus?: string;
    shipmentStatus?: string;
    origin?: string;
    destination?: string;
    quantity?: string;
    dispatchDate?: string;
    truckPlate?: string;
  }>();

  const decodedLogon = typeof id === 'string' ? safeDecode(id) : '';
  const decodedShipmentNumber =
    typeof shipmentNumber === 'string' ? safeDecode(shipmentNumber) : '';
  const decodedOrderStatus =
    typeof orderStatus === 'string' ? safeDecode(orderStatus) : '';
  const decodedShipmentStatus =
    typeof shipmentStatus === 'string' ? safeDecode(shipmentStatus) : '';
  const decodedOrigin = typeof origin === 'string' ? safeDecode(origin) : '';
  const decodedDestination =
    typeof destination === 'string' ? safeDecode(destination) : '';
  const decodedQuantity = useMemo(() => {
    if (typeof quantity !== 'string' || quantity.trim().length === 0) return undefined;
    const parsed = Number(safeDecode(quantity));
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [quantity]);
  const decodedDispatchDate =
    typeof dispatchDate === 'string' ? safeDecode(dispatchDate) : '';
  const decodedTruckPlate =
    typeof truckPlate === 'string' ? safeDecode(truckPlate) : '';

  const {
    data: feedbackData,
    isFetching: isFeedbackFetching,
  } = useGetFeedbackByLogonQuery(decodedLogon, { skip: !decodedLogon });

  const feedback = useMemo(() => mapShipmentFeedback(feedbackData), [feedbackData]);
  const baseContext = useMemo(
    () =>
      mergeShipmentFeedbackContext(
        {
          logon: decodedLogon || undefined,
          shipmentNumber: decodedShipmentNumber || undefined,
          orderStatus: decodedOrderStatus || undefined,
          shipmentStatus: decodedShipmentStatus || undefined,
          origin: decodedOrigin || undefined,
          destination: decodedDestination || undefined,
          quantity: decodedQuantity,
          dispatchDate: decodedDispatchDate || undefined,
          truckPlate: decodedTruckPlate || undefined,
        } satisfies ShipmentFeedbackShipmentContext,
        feedback,
      ),
    [
      decodedDestination,
      decodedDispatchDate,
      decodedLogon,
      decodedOrderStatus,
      decodedOrigin,
      decodedQuantity,
      decodedShipmentNumber,
      decodedShipmentStatus,
      decodedTruckPlate,
      feedback,
    ],
  );
  const shouldLookupShipmentContext =
    Boolean(decodedLogon) && !hasCompleteShipmentFeedbackContext(baseContext);
  const {
    data: shipmentContextData,
    isLoading: isShipmentContextLoading,
    isError: isShipmentContextError,
    error: shipmentContextError,
    refetch: refetchShipmentContext,
  } = useGetShipmentsByLogonQuery(decodedLogon, {
    skip: !shouldLookupShipmentContext,
  });
  const shipmentContext = useMemo(
    () => mergeShipmentFeedbackContext(baseContext, mapShipmentFeedbackContext(shipmentContextData)),
    [baseContext, shipmentContextData],
  );
  const resolvedDriverId = shipmentContext?.driverSapId;
  const { data: driverHosData, isFetching: isDriverHosFetching } = useGetDriverHosQuery(
    resolvedDriverId ?? 0,
    {
      skip: !resolvedDriverId,
    },
  );
  const driverHosRecord = useMemo(() => mapDriverHos(driverHosData), [driverHosData]);

  const handleOpenFeedback = () => {
    if (!decodedLogon) return;

    router.push({
      pathname: '/(tabs)/shipments/feedback/[logon]',
      params: {
        logon: decodedLogon,
        shipmentNumber: shipmentContext?.shipmentNumber ?? decodedShipmentNumber,
        orderStatus: shipmentContext?.orderStatus ?? decodedOrderStatus,
        shipmentStatus: shipmentContext?.shipmentStatus ?? decodedShipmentStatus,
        origin: shipmentContext?.origin ?? decodedOrigin,
        destination: shipmentContext?.destination ?? decodedDestination,
        quantity:
          shipmentContext?.quantity !== undefined ? String(shipmentContext.quantity) : quantity ?? '',
        dispatchDate: shipmentContext?.dispatchDate ?? decodedDispatchDate,
        truckPlate: shipmentContext?.truckPlate ?? decodedTruckPlate,
      },
    } as any);
  };

  const isLoading = isShipmentContextLoading && !shipmentContext;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Shipment Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <>
            <SkeletonLoader width="100%" height={200} style={{ marginBottom: spacing.base }} />
            <SkeletonLoader width="100%" height={220} />
          </>
        ) : isShipmentContextError && !shipmentContext ? (
          <ErrorView
            message={getShipmentFeedbackApiErrorMessage(
              shipmentContextError,
              'Could not load shipment details.',
              'load',
            )}
            onRetry={refetchShipmentContext}
          />
        ) : (
          <>
            <ShipmentContextCard context={shipmentContext} variant="elevated" />
            <DriverHosCard hos={driverHosRecord} isLoading={isDriverHosFetching} />

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Actions</Text>
              <Text style={styles.sectionSubtitle}>
                Open the driver feedback view for this shipment to review or submit feedback.
              </Text>
              <Button
                title={isFeedbackFetching ? 'Loading Feedback...' : 'Open Driver Feedback'}
                onPress={handleOpenFeedback}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
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
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.base,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
