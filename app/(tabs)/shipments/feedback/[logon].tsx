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
import { getShipmentFeedbackApiErrorMessage } from '@/features/shipmentFeedback/errors';
import {
  getShipmentFeedbackExists,
  mapShipmentFeedback,
} from '@/features/shipmentFeedback/mapper';
import { useGetFeedbackByLogonQuery } from '@/store/api/shipmentFeedbackApi';
import type { ShipmentFeedbackContribution } from '@/types/api';
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

const toRatingStatus = (
  rating?: string,
): 'success' | 'warning' | 'danger' | 'neutral' => {
  const normalized = rating?.toUpperCase();
  if (normalized === 'GREEN') return 'success';
  if (normalized === 'AMBER') return 'warning';
  if (normalized === 'RED') return 'danger';
  return 'neutral';
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
    </View>
  );
}

export default function ShipmentFeedbackDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logon, shipmentNumber } = useLocalSearchParams<{
    logon: string;
    shipmentNumber?: string;
  }>();

  const decodedLogon = typeof logon === 'string' ? safeDecode(logon) : '';
  const decodedShipmentNumber =
    typeof shipmentNumber === 'string' ? safeDecode(shipmentNumber) : '';
  const navigateToCreate = () => {
    if (!decodedLogon) return;
    router.push({
      pathname: '/(tabs)/shipments/feedback/create/[logon]',
      params: {
        logon: decodedLogon,
        shipmentNumber: decodedShipmentNumber,
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
        <View style={{ width: 32 }} />
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
            <Card variant="elevated" padding="base">
              <View style={styles.topRow}>
                <Text style={styles.logonText}>{feedback.logon ?? decodedLogon}</Text>
                <StatusBadge
                  label={(feedback.driverArrivalRating ?? 'Unknown').toUpperCase()}
                  status={toRatingStatus(feedback.driverArrivalRating)}
                />
              </View>
              <InfoRow label="Shipment" value={feedback.shipmentNumber ?? 'N/A'} />
              <InfoRow label="Feedback Date" value={toDateTime(feedback.feedbackDate)} />
              <InfoRow label="Driver" value={feedback.driverName ?? 'N/A'} />
              <InfoRow label="Driver SAP ID" value={toNumberLabel(feedback.driverSapId)} />
              <InfoRow label="Truck Plate" value={feedback.truckPlate ?? 'N/A'} />
              <InfoRow label="Transporter" value={feedback.transporterNumber ?? 'N/A'} />
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Driver Notes</Text>
              <InfoRow
                label="Driver Feedback"
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

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Ratings and Metrics</Text>
              <InfoRow
                label="Driver Score on Arrival"
                value={toNumberLabel(feedback.driverScoreOnArrival)}
              />
              <InfoRow
                label="Driver Behaviour"
                value={feedback.driverBehaviour ?? 'N/A'}
              />
              <InfoRow
                label="Remedial Action"
                value={feedback.remedialAction ?? 'N/A'}
              />
              <InfoRow
                label="Distance Covered"
                value={toNumberLabel(feedback.distanceCovered)}
              />
              <InfoRow
                label="Unknown Distance Covered"
                value={toNumberLabel(feedback.unknownDistanceCovered)}
              />
              <InfoRow
                label="HOS Hours (Manual)"
                value={toNumberLabel(feedback.hosHoursManual)}
              />
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.sectionTitle}>Violations and Consequence</Text>
              <InfoRow
                label="Total Violations"
                value={toNumberLabel(feedback.violationsTotalManual)}
              />
              <InfoRow
                label="OS Violations"
                value={toNumberLabel(feedback.violationsOsManual)}
              />
              <InfoRow
                label="HB Violations"
                value={toNumberLabel(feedback.violationsHbManual)}
              />
              <InfoRow
                label="HA Violations"
                value={toNumberLabel(feedback.violationsHaManual)}
              />
              <InfoRow
                label="CD Violations"
                value={toNumberLabel(feedback.violationsCdManual)}
              />
              <InfoRow
                label="Consequence Due"
                value={toLabel(feedback.consequenceDue)}
              />
              <InfoRow
                label="Consequence Applied"
                value={feedback.consequenceApplied ?? 'N/A'}
              />
              <InfoRow
                label="Manual Override Reason"
                value={feedback.manualOverrideReason ?? 'N/A'}
              />
            </Card>

            {(feedback.createdAt || feedback.updatedAt || feedback.contributions.length > 0) && (
              <Card variant="default" padding="base">
                <Text style={styles.sectionTitle}>Audit Trail</Text>
                {feedback.createdAt ? (
                  <InfoRow label="Created At" value={toDateTime(feedback.createdAt)} />
                ) : null}
                {feedback.updatedAt ? (
                  <InfoRow label="Updated At" value={toDateTime(feedback.updatedAt)} />
                ) : null}

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
  content: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  logonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
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
});
