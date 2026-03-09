import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, Card } from '@/components/ui';
import { FeedbackList } from '@/features/shipmentFeedback/FeedbackList';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useGetAllShipmentsQuery } from '@/store/api/shipmentsApi';
import { colors, fontSize, spacing } from '@/constants/theme';

type DateField = 'start' | 'end';
interface ShipmentOption {
  logon: string;
  shipmentNumber: string;
  truckPlate?: string;
  orderStatus?: string;
  shipmentStatus?: string;
  quantity?: number;
  origin?: string;
  destination?: string;
  dispatchDate?: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');
const toIsoDate = (value: Date): string =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
const fromIsoDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map((entry) => Number(entry));
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

function DateChip({
  value,
  onPress,
}: {
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.dateChip} onPress={onPress}>
      <Ionicons name="calendar-outline" size={14} color={colors.primary} />
      <Text style={styles.dateChipValue} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

export default function ShipmentFeedbackIndexScreen() {
  const router = useRouter();
  const transporterNumber = useTransporterNumber();
  const { startDate: defaultStartDate, endDate: defaultEndDate } = useAppSelector(
    (state) => state.filters.dateRange,
  );

  const [startDateInput, setStartDateInput] = useState(defaultStartDate);
  const [endDateInput, setEndDateInput] = useState(defaultEndDate);
  const [appliedStartDate, setAppliedStartDate] = useState(defaultStartDate);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultEndDate);
  const [pickerField, setPickerField] = useState<DateField | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  const {
    data: shipmentOptionsData,
    isLoading: isShipmentOptionsLoading,
  } = useGetAllShipmentsQuery(
    {
      startDate: appliedStartDate,
      endDate: appliedEndDate,
      transporterSapId: transporterNumber,
      page: 1,
      limit: 100,
      region: 'ALL',
      status: 'ALL',
    },
    { skip: !transporterNumber },
  );

  const shipmentOptions = useMemo<ShipmentOption[]>(() => {
    const result = shipmentOptionsData?.result as Record<string, unknown> | unknown[] | undefined;
    const items = Array.isArray(result)
      ? result
      : Array.isArray((result as Record<string, unknown> | undefined)?.content)
      ? ((result as Record<string, unknown>).content as unknown[])
      : [];

    const deduped = new Map<string, ShipmentOption>();

    for (const entry of items as Array<Record<string, unknown>>) {
      const logon =
        typeof entry.logon === 'string'
          ? entry.logon
          : typeof entry.logon === 'number'
          ? String(entry.logon)
          : '';
      const shipmentNumber =
        typeof entry.shipmentNumber === 'string'
          ? entry.shipmentNumber
          : typeof entry.shipmentNumber === 'number'
          ? String(entry.shipmentNumber)
          : '';
      const truckPlate =
        typeof entry.truckPlate === 'string' ? entry.truckPlate : undefined;
      const orderStatus =
        typeof entry.orderStatus === 'string' ? entry.orderStatus : undefined;
      const shipmentStatus =
        typeof entry.shipmentStatus === 'string'
          ? entry.shipmentStatus
          : typeof entry.leadTimeSla === 'string'
          ? entry.leadTimeSla
          : undefined;
      const quantity =
        typeof entry.quantity === 'number'
          ? entry.quantity
          : typeof entry.quantity === 'string'
          ? Number(entry.quantity)
          : undefined;
      const origin = typeof entry.plant === 'string' ? entry.plant : undefined;
      const destination =
        typeof entry.customerName === 'string' ? entry.customerName : undefined;
      const dispatchDate =
        typeof entry.dispatchDate === 'string' ? entry.dispatchDate : undefined;

      if (!logon || !shipmentNumber || deduped.has(logon)) continue;
      deduped.set(logon, {
        logon,
        shipmentNumber,
        truckPlate,
        orderStatus,
        shipmentStatus,
        quantity,
        origin,
        destination,
        dispatchDate,
      });
    }

    return Array.from(deduped.values());
  }, [shipmentOptionsData]);

  const pickerDate = useMemo(() => {
    if (pickerField === 'start') return fromIsoDate(startDateInput);
    if (pickerField === 'end') return fromIsoDate(endDateInput);
    return new Date();
  }, [endDateInput, pickerField, startDateInput]);

  const onChangePicker = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setPickerField(null);
    }
    if (event.type === 'dismissed' || !selectedDate || !pickerField) return;

    const nextValue = toIsoDate(selectedDate);
    if (pickerField === 'start') setStartDateInput(nextValue);
    if (pickerField === 'end') setEndDateInput(nextValue);
  };

  const applyDateRange = () => {
    const normalizedStartDate = startDateInput.trim();
    const normalizedEndDate = endDateInput.trim();

    if (normalizedStartDate > normalizedEndDate) {
      setValidationError('Start date cannot be after end date.');
      return;
    }

    setValidationError('');
    setAppliedStartDate(normalizedStartDate);
    setAppliedEndDate(normalizedEndDate);
  };

  const resetDateRange = () => {
    setValidationError('');
    setStartDateInput(defaultStartDate);
    setEndDateInput(defaultEndDate);
    setAppliedStartDate(defaultStartDate);
    setAppliedEndDate(defaultEndDate);
  };

  useEffect(() => {
    setSelectedShipment((current) => {
      if (!current) return null;
      return shipmentOptions.find((entry) => entry.logon === current.logon) ?? null;
    });
    setIsDropdownOpen(false);
  }, [shipmentOptions]);

  const launchCreateFeedback = () => {
    if (!selectedShipment) return;
    router.push({
      pathname: '/(tabs)/shipments/feedback/create/[logon]',
      params: {
        logon: selectedShipment.logon,
        shipmentNumber: selectedShipment.shipmentNumber,
        orderStatus: selectedShipment.orderStatus ?? '',
        shipmentStatus: selectedShipment.shipmentStatus ?? '',
        origin: selectedShipment.origin ?? '',
        destination: selectedShipment.destination ?? '',
        quantity:
          selectedShipment.quantity !== undefined ? String(selectedShipment.quantity) : '',
        dispatchDate: selectedShipment.dispatchDate ?? '',
        truckPlate: selectedShipment.truckPlate ?? '',
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Driver Feedback"
        subtitle="All feedback for your transporter"
      />

      <View style={styles.filterContainer}>
        <Card variant="default" padding="base">
          <Text style={styles.filterTitle}>Date Range</Text>
          <View style={styles.filterRow}>
            <DateChip
              value={startDateInput}
              onPress={() => setPickerField('start')}
            />
            <Text style={styles.rangeSeparator}>to</Text>
            <DateChip
              value={endDateInput}
              onPress={() => setPickerField('end')}
            />
            <TouchableOpacity
              style={styles.iconButtonPrimary}
              onPress={applyDateRange}
              accessibilityRole="button"
              accessibilityLabel="Apply date range"
            >
              <Ionicons name="checkmark" size={18} color={colors.surface} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButtonSecondary}
              onPress={resetDateRange}
              accessibilityRole="button"
              accessibilityLabel="Reset date range"
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
          {pickerField && Platform.OS === 'ios' ? (
            <View style={styles.iosPickerContainer}>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={pickerDate}
                onChange={onChangePicker}
                maximumDate={new Date()}
              />
              <Button title="Done" size="sm" onPress={() => setPickerField(null)} />
            </View>
          ) : null}
        </Card>
      </View>

      <View style={styles.createContainer}>
        <Card variant="default" padding="base">
          <Text style={styles.createTitle}>Create New Feedback</Text>
          <Text style={styles.createSubtitle}>
            Select a shipment logon from the current filtered shipments.
          </Text>

          <Pressable
            style={styles.dropdownTrigger}
            onPress={() => setIsDropdownOpen((current) => !current)}
          >
            <View style={styles.dropdownCopy}>
              <Text style={styles.dropdownLabel}>Shipment Logon</Text>
              <Text style={styles.dropdownValue} numberOfLines={1}>
                {selectedShipment
                  ? `${selectedShipment.logon} • ${selectedShipment.shipmentNumber}`
                  : isShipmentOptionsLoading
                  ? 'Loading shipments...'
                  : 'Select a logon'}
              </Text>
            </View>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {isDropdownOpen ? (
            <View style={styles.dropdownMenu}>
              <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                {shipmentOptions.map((option) => (
                  <TouchableOpacity
                    key={option.logon}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedShipment(option);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionTitle}>{option.logon}</Text>
                    <Text style={styles.dropdownOptionMeta} numberOfLines={1}>
                      {option.shipmentNumber}
                      {option.truckPlate ? ` • ${option.truckPlate}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
                {!isShipmentOptionsLoading && shipmentOptions.length === 0 ? (
                  <Text style={styles.dropdownEmpty}>
                    No shipments available for the selected date range.
                  </Text>
                ) : null}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.createActionRow}>
            <Button
              title="Create Feedback"
              onPress={launchCreateFeedback}
              disabled={!selectedShipment}
              fullWidth
            />
          </View>
        </Card>
      </View>

      {pickerField && Platform.OS !== 'ios' ? (
        <DateTimePicker
          mode="date"
          display="default"
          value={pickerDate}
          onChange={onChangePicker}
          maximumDate={new Date()}
        />
      ) : null}

      <FeedbackList startDate={appliedStartDate} endDate={appliedEndDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  createContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  filterTitle: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateChip: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateChipValue: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
  },
  rangeSeparator: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  iconButtonPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  iconButtonSecondary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  iosPickerContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  createTitle: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  createSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  dropdownTrigger: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dropdownCopy: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  dropdownValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  dropdownMenu: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionTitle: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  dropdownOptionMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dropdownEmpty: {
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  createActionRow: {
    marginTop: spacing.sm,
  },
});
