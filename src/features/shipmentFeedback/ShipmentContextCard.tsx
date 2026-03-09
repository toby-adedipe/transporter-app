import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, StatusBadge } from '@/components/ui';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import { formatStatus, mapTruckStatus } from '@/features/visibility/utils';
import type { ShipmentFeedbackShipmentContext } from '@/types/api';

interface ShipmentContextCardProps {
  context?: ShipmentFeedbackShipmentContext | null;
  title?: string;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated';
  density?: 'default' | 'compact';
  onCopyLogon?: (value: string) => void;
}

interface ContextRow {
  label: string;
  value: string;
}

const formatDateTime = (value?: string): string | undefined => {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const toDisplayValue = (value?: string | number | null): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
};

function InfoRow({
  label,
  value,
  density = 'default',
}: ContextRow & { density?: ShipmentContextCardProps['density'] }) {
  return (
    <View style={[styles.infoRow, density === 'compact' && styles.infoRowCompact]}>
      <Text style={[styles.infoLabel, density === 'compact' && styles.infoLabelCompact]}>{label}</Text>
      <Text style={[styles.infoValue, density === 'compact' && styles.infoValueCompact]}>{value}</Text>
    </View>
  );
}

function CompactInfoPair({
  left,
  right,
}: {
  left?: ContextRow;
  right?: ContextRow;
}) {
  if (!left && !right) return null;

  return (
    <View style={styles.infoGridRow}>
      {left ? (
        <View style={styles.infoGridCell}>
          <InfoRow label={left.label} value={left.value} density="compact" />
        </View>
      ) : (
        <View style={[styles.infoGridCell, styles.infoGridSpacer]} />
      )}
      {right ? (
        <View style={styles.infoGridCell}>
          <InfoRow label={right.label} value={right.value} density="compact" />
        </View>
      ) : (
        <View style={[styles.infoGridCell, styles.infoGridSpacer]} />
      )}
    </View>
  );
}

export function ShipmentContextCard({
  context,
  title = 'Shipment Details',
  footer,
  variant = 'elevated',
  density = 'default',
  onCopyLogon,
}: ShipmentContextCardProps) {
  if (!context) return null;

  const customerValue =
    context.customerName &&
    context.customerName.trim().toLowerCase() !== context.destination?.trim().toLowerCase()
      ? context.customerName.trim()
      : undefined;

  const rows: ContextRow[] = [
    { label: 'Shipment Number', value: toDisplayValue(context.shipmentNumber) ?? '' },
    { label: 'Quantity', value: toDisplayValue(context.quantity) ?? '' },
    { label: 'Origin', value: toDisplayValue(context.origin) ?? '' },
    { label: 'Destination', value: toDisplayValue(context.destination) ?? '' },
    { label: 'Customer', value: toDisplayValue(customerValue) ?? '' },
    { label: 'Dispatch Date', value: formatDateTime(context.dispatchDate) ?? '' },
    { label: 'Truck Plate', value: toDisplayValue(context.truckPlate) ?? '' },
    { label: 'Driver', value: toDisplayValue(context.driverName) ?? '' },
    { label: 'Driver SAP ID', value: toDisplayValue(context.driverSapId) ?? '' },
  ].filter((row) => row.value);

  const rowMap = {
    shipmentNumber: rows.find((row) => row.label === 'Shipment Number'),
    quantity: rows.find((row) => row.label === 'Quantity'),
    origin: rows.find((row) => row.label === 'Origin'),
    destination: rows.find((row) => row.label === 'Destination'),
    customer: rows.find((row) => row.label === 'Customer'),
    dispatchDate: rows.find((row) => row.label === 'Dispatch Date'),
    truckPlate: rows.find((row) => row.label === 'Truck Plate'),
    driver: rows.find((row) => row.label === 'Driver'),
    driverSapId: rows.find((row) => row.label === 'Driver SAP ID'),
  };

  if (!context.logon && rows.length === 0 && !footer) return null;

  return (
    <Card variant={variant} padding={density === 'compact' ? 'md' : 'base'}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {context.logon || context.orderStatus || context.shipmentStatus ? (
        <View style={[styles.topRow, density === 'compact' && styles.topRowCompact]}>
          <View style={styles.logonBlock}>
            <Text style={styles.summaryLabel}>Shipment Logon</Text>
            {context.logon ? (
              <View style={styles.logonValueRow}>
                <Text style={[styles.logonValue, density === 'compact' && styles.logonValueCompact]}>
                  {context.logon}
                </Text>
                {onCopyLogon ? (
                  <Pressable
                    onPress={() => onCopyLogon(context.logon as string)}
                    style={({ pressed }) => [styles.copyButton, pressed && styles.copyButtonPressed]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Copy shipment logon"
                  >
                    <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
          {context.orderStatus || context.shipmentStatus ? (
            <StatusBadge
              label={formatStatus(context.orderStatus ?? context.shipmentStatus)}
              status={mapTruckStatus(context.orderStatus ?? context.shipmentStatus)}
            />
          ) : null}
        </View>
      ) : null}

      {rows.length > 0 ? (
        density === 'compact' ? (
          <View style={[styles.infoList, styles.infoListCompact]}>
            <CompactInfoPair left={rowMap.shipmentNumber} right={rowMap.quantity} />
            {rowMap.origin ? <InfoRow label={rowMap.origin.label} value={rowMap.origin.value} density="compact" /> : null}
            {rowMap.destination ? <InfoRow label={rowMap.destination.label} value={rowMap.destination.value} density="compact" /> : null}
            {rowMap.customer ? <InfoRow label={rowMap.customer.label} value={rowMap.customer.value} density="compact" /> : null}
            <CompactInfoPair left={rowMap.dispatchDate} right={rowMap.truckPlate} />
            <CompactInfoPair left={rowMap.driver} right={rowMap.driverSapId} />
          </View>
        ) : (
          <View style={styles.infoList}>
            {rows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} density={density} />
            ))}
          </View>
        )
      ) : null}

      {footer ? <View style={[styles.footer, density === 'compact' && styles.footerCompact]}>{footer}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  topRowCompact: {
    marginTop: spacing.md,
  },
  logonBlock: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  logonValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    flexShrink: 1,
  },
  logonValueCompact: {
    fontSize: fontSize.xl,
    marginTop: 2,
  },
  logonValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  copyButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  copyButtonPressed: {
    opacity: 0.72,
  },
  infoList: {
    marginTop: spacing.base,
    gap: spacing.sm,
  },
  infoListCompact: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  infoRow: {
    gap: spacing.xs,
  },
  infoRowCompact: {
    gap: 2,
  },
  infoGridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoGridCell: {
    flex: 1,
    minWidth: 0,
  },
  infoGridSpacer: {
    opacity: 0,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoLabelCompact: {
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  infoValueCompact: {
    lineHeight: 18,
  },
  footer: {
    marginTop: spacing.sm,
  },
  footerCompact: {
    marginTop: spacing.md,
  },
});
