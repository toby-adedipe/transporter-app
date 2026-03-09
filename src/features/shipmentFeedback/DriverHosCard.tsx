import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, StatusBadge } from '@/components/ui';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import type { DriverHosRecord } from '@/types/api';

interface DriverHosCardProps {
  hos?: DriverHosRecord | null;
  isLoading?: boolean;
  title?: string;
}

const parseIsoDuration = (value?: string): { days: number; hours: number; minutes: number; seconds: number } | null => {
  if (!value) return null;

  const match = value.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/,
  );

  if (!match) return null;

  return {
    days: Number(match[1] ?? 0),
    hours: Number(match[2] ?? 0),
    minutes: Number(match[3] ?? 0),
    seconds: Number(match[4] ?? 0),
  };
};

const formatIsoDuration = (value?: string): string | null => {
  const parsed = parseIsoDuration(value);
  if (!parsed) return value ?? null;

  const parts: string[] = [];

  if (parsed.days > 0) parts.push(`${parsed.days}d`);
  if (parsed.hours > 0) parts.push(`${parsed.hours}h`);
  if (parsed.minutes > 0) parts.push(`${parsed.minutes}m`);

  if (parts.length === 0 && parsed.seconds > 0) {
    parts.push('<1m');
  }

  return parts.length > 0 ? parts.join(' ') : '0m';
};

const formatDateTime = (value?: string): string | undefined => {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function DriverHosCard({
  hos,
  isLoading = false,
  title = 'Driver HOS',
}: DriverHosCardProps) {
  const rows = useMemo(() => {
    const items: Array<{ label: string; value: string | null }> = [
      {
        label: 'Available Before Break',
        value: formatIsoDuration(hos?.availableDrivingBeforeBreak),
      },
      {
        label: 'Daily Time Before Rest',
        value: formatIsoDuration(hos?.dailyTimeBeforeRest),
      },
      {
        label: 'Weekly Time Before Rest',
        value: formatIsoDuration(hos?.weeklyTimeBeforeRest),
      },
      {
        label: 'Expected Rest Duration',
        value: formatIsoDuration(hos?.expectedRestDuration),
      },
      {
        label: 'Day Driving Used',
        value: formatIsoDuration(hos?.dayDrivingUsed),
      },
      {
        label: 'Night Driving Used',
        value: formatIsoDuration(hos?.nightDrivingUsed),
      },
    ];

    const rollingValue = formatIsoDuration(hos?.dailyAvailableDrivingRolling);
    const dailyBeforeRestValue = formatIsoDuration(hos?.dailyTimeBeforeRest);
    if (rollingValue && rollingValue !== dailyBeforeRestValue) {
      items.splice(2, 0, {
        label: 'Daily Driving Available',
        value: rollingValue,
      });
    }

    return items.filter((row): row is { label: string; value: string } => Boolean(row.value));
  }, [
    hos?.availableDrivingBeforeBreak,
    hos?.dailyAvailableDrivingRolling,
    hos?.dailyTimeBeforeRest,
    hos?.dayDrivingUsed,
    hos?.expectedRestDuration,
    hos?.nightDrivingUsed,
    hos?.weeklyTimeBeforeRest,
  ]);

  if (!hos && !isLoading) return null;

  return (
    <Card variant="default" padding="base">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {hos?.isOnDuty !== undefined ? (
          <StatusBadge
            label={hos.isOnDuty ? 'On Duty' : 'Off Duty'}
            status={hos.isOnDuty ? 'warning' : 'neutral'}
          />
        ) : null}
      </View>

      {isLoading && !hos ? (
        <Text style={styles.placeholder}>Loading live driver HOS details.</Text>
      ) : (
        <>
          {hos?.currentStatusDescription ? (
            <View style={styles.statusBanner}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={styles.statusValue}>{hos.currentStatusDescription}</Text>
            </View>
          ) : null}

          {rows.length > 0 ? (
            <View style={styles.rows}>
              {rows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} />
              ))}
            </View>
          ) : (
            <Text style={styles.placeholder}>No live HOS details are available for this driver yet.</Text>
          )}

          {hos?.lastUpdated ? (
            <Text style={styles.updatedAt}>Last updated {formatDateTime(hos.lastUpdated)}</Text>
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  statusBanner: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.xs,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  rows: {
    marginTop: spacing.base,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  placeholder: {
    marginTop: spacing.base,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  updatedAt: {
    marginTop: spacing.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
