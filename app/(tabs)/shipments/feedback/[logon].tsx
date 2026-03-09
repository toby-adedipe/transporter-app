import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, SkeletonLoader, StatusBadge } from '@/components/ui';
import { ErrorView } from '@/components/ErrorView';
import { DriverHosCard } from '@/features/shipmentFeedback/DriverHosCard';
import { getShipmentFeedbackApiErrorMessage } from '@/features/shipmentFeedback/errors';
import {
  getShipmentFeedbackExists,
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
import type {
  ShipmentFeedbackContribution,
  ShipmentFeedbackShipmentContext,
} from '@/types/api';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const toLabel = (value?: boolean): string => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'N/A';
};

const toDateTime = (value?: string): string => {
  if (!value) return 'N/A';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
};

const toNumberLabel = (value?: number): string =>
  value === undefined || value === null ? 'N/A' : String(value);

const hasValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const getStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') return null;
  const typedError = error as any;
  const status =
    typeof typedError.status === 'number'
      ? typedError.status
      : typeof typedError.originalStatus === 'number'
      ? typedError.originalStatus
      : null;
  return status;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ContributionRow({ contribution }: { contribution: ShipmentFeedbackContribution }) {
  return (
    <View style={styles.contributionRow}>
      <View style={styles.contributionHeader}>
        <Text style={styles.contributionTitle}>
          {contribution.action ?? 'Update'}
        </Text>
        <Text style={styles.contributionDate}>{toDateTime(contribution.createdAt)}</Text>
      </View>
      <Text style={styles.contributionMeta}>
        {contribution.actorName ?? contribution.actorId ?? 'Unknown actor'}
        {contribution.actorType ? ` (${contribution.actorType})` : ''}
      </Text>
      {contribution.remarks ? (
        <Text style={styles.contributionRemarks}>{contribution.remarks}</Text>
      ) : null}
    </View>
  );
}

export default function ShipmentFeedbackDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    logon,
    shipmentNumber,
    orderStatus,
    shipmentStatus,
    origin,
    destination,
    quantity,
    dispatchDate,
    truckPlate,
  } = useLocalSearchParams<{
    logon: string;
    shipmentNumber?: string;
    orderStatus?: string;
    shipmentStatus?: string;
    origin?: string;
    destination?: string;
    quantity?: string;
    dispatchDate?: string;
    truckPlate?: string;
  }>();

  const decodedLogon = typeof logon === 'string' ? safeDecode(logon) : '';
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
  const navigateToCreate = () => {
    if (!decodedLogon) return;
    router.push({
      pathname: '/(tabs)/shipments/feedback/create/[logon]',
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

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetFeedbackByLogonQuery(decodedLogon, { skip: !decodedLogon });

  const feedback = useMemo(() => mapShipmentFeedback(data), [data]);
  const feedbackExists = useMemo(() => getShipmentFeedbackExists(data), [data]);
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
      decodedDispatchDate,
      decodedDestination,
      decodedLogon,
      decodedOrigin,
      decodedOrderStatus,
      decodedQuantity,
      decodedShipmentNumber,
      decodedShipmentStatus,
      decodedTruckPlate,
      feedback,
    ],
  );
  const shouldLookupShipmentContext =
    Boolean(decodedLogon) && !hasCompleteShipmentFeedbackContext(baseContext);
  const { data: shipmentContextData } = useGetShipmentsByLogonQuery(decodedLogon, {
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
  const journeyMetadataRows = useMemo(
    () =>
      [
        { label: 'Feedback Date', value: feedback?.feedbackDate ? toDateTime(feedback.feedbackDate) : null },
        { label: 'Transporter Name', value: feedback?.transporterName ?? null },
        { label: 'Transporter Number', value: feedback?.transporterNumber ?? null },
        { label: 'Region', value: feedback?.region ?? null },
        { label: 'Customer Name', value: feedback?.customerName ?? null },
        { label: 'Customer Location', value: feedback?.customerLocation ?? null },
      ].filter((row): row is { label: string; value: string } => hasValue(row.value)),
    [feedback],
  );
  const effectiveMetricRows = useMemo(
    () =>
      [
        {
          label: 'Driver Score',
          value: hasValue(feedback?.driverScoreOnArrival)
            ? toNumberLabel(feedback?.driverScoreOnArrival)
            : null,
        },
        { label: 'Arrival Rating', value: feedback?.driverArrivalRating ?? null },
        { label: 'Driver Behaviour', value: feedback?.driverBehaviour ?? null },
        { label: 'Remedial Action', value: feedback?.remedialAction ?? null },
        {
          label: 'Distance Covered',
          value: hasValue(feedback?.distanceCovered)
            ? toNumberLabel(feedback?.distanceCovered)
            : null,
        },
        {
          label: 'Distance Without Bluekey',
          value: hasValue(feedback?.unknownDistanceCovered)
            ? toNumberLabel(feedback?.unknownDistanceCovered)
            : null,
        },
        {
          label: 'Effective HOS',
          value: hasValue(feedback?.effectiveHosHours)
            ? toNumberLabel(feedback?.effectiveHosHours)
            : null,
        },
        {
          label: 'Effective Total Violations',
          value: hasValue(feedback?.effectiveViolationsTotal)
            ? toNumberLabel(feedback?.effectiveViolationsTotal)
            : null,
        },
        {
          label: 'Effective OS Violations',
          value: hasValue(feedback?.effectiveViolationsOs)
            ? toNumberLabel(feedback?.effectiveViolationsOs)
            : null,
        },
        {
          label: 'Effective HB Violations',
          value: hasValue(feedback?.effectiveViolationsHb)
            ? toNumberLabel(feedback?.effectiveViolationsHb)
            : null,
        },
        {
          label: 'Effective HA Violations',
          value: hasValue(feedback?.effectiveViolationsHa)
            ? toNumberLabel(feedback?.effectiveViolationsHa)
            : null,
        },
        {
          label: 'Effective CD Violations',
          value: hasValue(feedback?.effectiveViolationsCd)
            ? toNumberLabel(feedback?.effectiveViolationsCd)
            : null,
        },
      ].filter((row): row is { label: string; value: string } => hasValue(row.value)),
    [feedback],
  );
  const generatedMetricRows = useMemo(
    () =>
      [
        {
          label: 'Generated At',
          value: feedback?.autoMetricsGeneratedAt ? toDateTime(feedback.autoMetricsGeneratedAt) : null,
        },
        {
          label: 'Generated HOS',
          value: hasValue(feedback?.hosHoursGenerated)
            ? toNumberLabel(feedback?.hosHoursGenerated)
            : null,
        },
        {
          label: 'Generated Total Violations',
          value: hasValue(feedback?.violationsTotalGenerated)
            ? toNumberLabel(feedback?.violationsTotalGenerated)
            : null,
        },
        {
          label: 'Generated OS Violations',
          value: hasValue(feedback?.violationsOsGenerated)
            ? toNumberLabel(feedback?.violationsOsGenerated)
            : null,
        },
        {
          label: 'Generated HB Violations',
          value: hasValue(feedback?.violationsHbGenerated)
            ? toNumberLabel(feedback?.violationsHbGenerated)
            : null,
        },
        {
          label: 'Generated HA Violations',
          value: hasValue(feedback?.violationsHaGenerated)
            ? toNumberLabel(feedback?.violationsHaGenerated)
            : null,
        },
        {
          label: 'Generated CD Violations',
          value: hasValue(feedback?.violationsCdGenerated)
            ? toNumberLabel(feedback?.violationsCdGenerated)
            : null,
        },
      ].filter((row): row is { label: string; value: string } => hasValue(row.value)),
    [feedback],
  );
  const manualOverrideRows = useMemo(
    () =>
      [
        {
          label: 'Manual HOS',
          value: hasValue(feedback?.hosHoursManual)
            ? toNumberLabel(feedback?.hosHoursManual)
            : null,
        },
        {
          label: 'Manual Total Violations',
          value: hasValue(feedback?.violationsTotalManual)
            ? toNumberLabel(feedback?.violationsTotalManual)
            : null,
        },
        {
          label: 'Manual OS Violations',
          value: hasValue(feedback?.violationsOsManual)
            ? toNumberLabel(feedback?.violationsOsManual)
            : null,
        },
        {
          label: 'Manual HB Violations',
          value: hasValue(feedback?.violationsHbManual)
            ? toNumberLabel(feedback?.violationsHbManual)
            : null,
        },
        {
          label: 'Manual HA Violations',
          value: hasValue(feedback?.violationsHaManual)
            ? toNumberLabel(feedback?.violationsHaManual)
            : null,
        },
        {
          label: 'Manual CD Violations',
          value: hasValue(feedback?.violationsCdManual)
            ? toNumberLabel(feedback?.violationsCdManual)
            : null,
        },
        { label: 'Manual Override Reason', value: feedback?.manualOverrideReason ?? null },
      ].filter((row): row is { label: string; value: string } => hasValue(row.value)),
    [feedback],
  );
  const consequenceRows = useMemo(
    () =>
      [
        {
          label: 'Consequence Due',
          value: feedback ? toLabel(feedback.consequenceDue) : null,
        },
        {
          label: 'Consequence Applied',
          value: feedback?.consequenceApplied ?? null,
        },
      ].filter((row): row is { label: string; value: string } => hasValue(row.value)),
    [feedback],
  );
  const auditRows = useMemo(
    () =>
      [
        {
          label: 'Created By',
          value: feedback?.createdByName ?? null,
        },
        {
          label: 'Created At',
          value: feedback?.createdDate ? toDateTime(feedback.createdDate) : feedback?.createdAt ? toDateTime(feedback.createdAt) : null,
        },
        {
          label: 'Updated By',
          value: feedback?.updatedByName ?? null,
        },
        {
          label: 'Updated At',
          value: feedback?.updatedDate ? toDateTime(feedback.updatedDate) : feedback?.updatedAt ? toDateTime(feedback.updatedAt) : null,
        },
      ].filter((row): row is { label: string; value: string } => hasValue(row.value)),
    [feedback],
  );
  const shouldShowAcknowledgment = Boolean(
    feedback?.requiresDriverAcknowledgment ||
      feedback?.driverAcknowledgedAt ||
      feedback?.driverAcknowledgedByName ||
      feedback?.driverAcknowledgedByUserId !== undefined,
  );
  const acknowledgmentStatus = feedback?.driverAcknowledgedAt
    ? { label: 'Acknowledged', status: 'success' as const }
    : feedback?.requiresDriverAcknowledgment
      ? { label: 'Pending', status: 'warning' as const }
      : { label: 'Not Required', status: 'neutral' as const };
  const statusCode = getStatusCode(error);
  const isNotFound = statusCode === 404;
  const shouldShowEmptyState = (!isError && feedbackExists === false) || !feedback;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Driver Feedback</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/shipments')}
          style={styles.headerAction}
          accessibilityRole="button"
          accessibilityLabel="Go to all shipments"
        >
          <Text style={styles.headerActionText}>All Shipments</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <>
            <SkeletonLoader width="100%" height={140} style={{ marginBottom: spacing.base }} />
            <SkeletonLoader width="100%" height={220} style={{ marginBottom: spacing.base }} />
            <SkeletonLoader width="100%" height={200} />
          </>
        ) : isError && isNotFound ? (
          <EmptyState
            icon="chatbubble-outline"
            title="No feedback found"
            subtitle={`No driver feedback submitted yet for logon ${decodedLogon}.`}
            actionLabel="Create Feedback"
            onAction={navigateToCreate}
          />
        ) : isError ? (
          <ErrorView
            message={getShipmentFeedbackApiErrorMessage(
              error,
              'Failed to load feedback details.',
              'load',
            )}
            onRetry={refetch}
          />
        ) : shouldShowEmptyState ? (
          <EmptyState
            icon="chatbubble-outline"
            title="No feedback found"
            subtitle={`No driver feedback submitted yet for logon ${decodedLogon}.`}
            actionLabel="Create Feedback"
            onAction={navigateToCreate}
          />
        ) : (
          <>
            <ShipmentContextCard context={shipmentContext} variant="elevated" />
            <DriverHosCard hos={driverHosRecord} isLoading={isDriverHosFetching} />

            {shouldShowAcknowledgment ? (
              <Card variant="default" padding="base">
                <View style={styles.cardHeader}>
                  <Text style={styles.sectionTitle}>Driver Acknowledgment</Text>
                  <StatusBadge
                    label={acknowledgmentStatus.label}
                    status={acknowledgmentStatus.status}
                  />
                </View>
                {feedback?.driverAcknowledgedAt ? (
                  <InfoRow
                    label="Acknowledged At"
                    value={toDateTime(feedback.driverAcknowledgedAt)}
                  />
                ) : null}
                {feedback?.driverAcknowledgedByName ? (
                  <InfoRow
                    label="Acknowledged By"
                    value={feedback.driverAcknowledgedByName}
                  />
                ) : null}
                {feedback?.driverAcknowledgedByUserId !== undefined ? (
                  <InfoRow
                    label="Acknowledged By User ID"
                    value={String(feedback.driverAcknowledgedByUserId)}
                  />
                ) : null}
              </Card>
            ) : null}

            {journeyMetadataRows.length > 0 ? (
              <Card variant="default" padding="base">
                <Text style={styles.sectionTitle}>Journey Details</Text>
                {journeyMetadataRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </Card>
            ) : null}

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Driver Notes</Text>
              <InfoRow
                label="Feedback from Driver"
                value={feedback.driverFeedbackText ?? 'N/A'}
              />
              <InfoRow
                label="Other Information"
                value={feedback.otherInformationText ?? 'N/A'}
              />
              <InfoRow label="Other Remarks" value={feedback.otherRemarks ?? 'N/A'} />
              <InfoRow
                label="Delay At Customer"
                value={toLabel(feedback.delayAtCustomer)}
              />
              <InfoRow
                label="Tampering Observed"
                value={toLabel(feedback.tamperingObserved)}
              />
            </Card>

            {effectiveMetricRows.length > 0 || generatedMetricRows.length > 0 ? (
              <Card variant="default" padding="base">
                <Text style={styles.sectionTitle}>Review of Driver IVMS Performance</Text>
                {effectiveMetricRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
                {generatedMetricRows.length > 0 ? (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Generated Metrics</Text>
                    {generatedMetricRows.map((row) => (
                      <InfoRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </View>
                ) : null}
              </Card>
            ) : null}

            {(consequenceRows.length > 0 || manualOverrideRows.length > 0) ? (
              <Card variant="default" padding="base">
                <Text style={styles.sectionTitle}>Consequence Management</Text>
                {consequenceRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
                {manualOverrideRows.length > 0 ? (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Manual Overrides</Text>
                    {manualOverrideRows.map((row) => (
                      <InfoRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </View>
                ) : null}
              </Card>
            ) : null}

            {(auditRows.length > 0 || feedback.contributions.length > 0) && (
              <Card variant="default" padding="base">
                <Text style={styles.sectionTitle}>Audit Trail</Text>
                {auditRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}

                {feedback.contributions.length > 0 ? (
                  <View style={styles.contributionList}>
                    {feedback.contributions.map((contribution, index) => (
                      <ContributionRow
                        key={`${contribution.createdAt ?? 'entry'}-${index}`}
                        contribution={contribution}
                      />
                    ))}
                  </View>
                ) : null}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  headerAction: {
    minWidth: 32,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
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
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoRow: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  contributionList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  subsection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subsectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  contributionRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.xs,
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  contributionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  contributionDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  contributionMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  contributionRemarks: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
