import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, FilterChip, SkeletonLoader } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { ErrorView } from '@/components/ErrorView';
import {
  getShipmentFeedbackApiErrorMessage,
  getShipmentFeedbackEligibilityMessage,
} from '@/features/shipmentFeedback/errors';
import {
  mapShipmentFeedbackEligibility,
  mapShipmentNumberByLogon,
} from '@/features/shipmentFeedback/mapper';
import {
  useCreateFeedbackMutation,
  useLazyPrecheckFeedbackEligibilityQuery,
} from '@/store/api/shipmentFeedbackApi';
import { useGetShipmentsByLogonQuery } from '@/store/api/shipmentsApi';
import type {
  ShipmentFeedbackArrivalRating,
  ShipmentFeedbackCreateRequest,
  ShipmentFeedbackEligibilityResult,
} from '@/types/api';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';

type DateField = 'feedbackDate';
type NullableBoolean = boolean | null;

interface FeedbackFormState {
  feedbackDate: string;
  driverFeedbackText: string;
  otherInformationText: string;
  otherRemarks: string;
  driverBehaviour: string;
  remedialAction: string;
  consequenceApplied: string;
  manualOverrideReason: string;
  distanceCovered: string;
  unknownDistanceCovered: string;
  driverScoreOnArrival: string;
  hosHoursManual: string;
  violationsTotalManual: string;
  violationsOsManual: string;
  violationsHbManual: string;
  violationsHaManual: string;
  violationsCdManual: string;
  delayAtCustomer: NullableBoolean;
  tamperingObserved: NullableBoolean;
  consequenceDue: NullableBoolean;
  driverArrivalRating: ShipmentFeedbackArrivalRating | '';
}

const pad = (value: number): string => String(value).padStart(2, '0');
const toIsoDate = (value: Date): string =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

const fromIsoDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map((entry) => Number(entry));
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getTodayIsoDate = (): string => toIsoDate(new Date());

const createInitialForm = (): FeedbackFormState => ({
  feedbackDate: getTodayIsoDate(),
  driverFeedbackText: '',
  otherInformationText: '',
  otherRemarks: '',
  driverBehaviour: '',
  remedialAction: '',
  consequenceApplied: '',
  manualOverrideReason: '',
  distanceCovered: '',
  unknownDistanceCovered: '',
  driverScoreOnArrival: '',
  hosHoursManual: '',
  violationsTotalManual: '',
  violationsOsManual: '',
  violationsHbManual: '',
  violationsHaManual: '',
  violationsCdManual: '',
  delayAtCustomer: null,
  tamperingObserved: null,
  consequenceDue: null,
  driverArrivalRating: '',
});

const parseOptionalNumber = (
  value: string,
  label: string,
  options?: { integer?: boolean },
): { value?: number; error?: string } => {
  const normalized = value.trim();
  if (!normalized) return {};

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a valid number.` };
  }

  if (options?.integer && !Number.isInteger(parsed)) {
    return { error: `${label} must be a whole number.` };
  }

  return { value: parsed };
};

function DateChip({ value, onPress }: { value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.dateChip} onPress={onPress}>
      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
      <Text style={styles.dateChipValue}>{value}</Text>
    </Pressable>
  );
}

function TextAreaField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        textAlignVertical="top"
        style={styles.textArea}
      />
    </View>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType ?? 'default'}
        style={styles.textInput}
      />
    </View>
  );
}

function BooleanField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: NullableBoolean;
  onChange: (nextValue: NullableBoolean) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        <FilterChip label="Yes" selected={value === true} onPress={() => onChange(true)} />
        <FilterChip label="No" selected={value === false} onPress={() => onChange(false)} />
      </View>
    </View>
  );
}

function RatingField({
  value,
  onChange,
}: {
  value: ShipmentFeedbackArrivalRating | '';
  onChange: (nextValue: ShipmentFeedbackArrivalRating) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>Driver Arrival Rating</Text>
      <View style={styles.chipRow}>
        <FilterChip label="Green" selected={value === 'GREEN'} onPress={() => onChange('GREEN')} />
        <FilterChip label="Amber" selected={value === 'AMBER'} onPress={() => onChange('AMBER')} />
        <FilterChip label="Red" selected={value === 'RED'} onPress={() => onChange('RED')} />
      </View>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="default" padding="base">
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </Card>
  );
}

export default function CreateShipmentFeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { logon, shipmentNumber } = useLocalSearchParams<{
    logon: string;
    shipmentNumber?: string;
  }>();
  const decodedLogon = typeof logon === 'string' ? safeDecode(logon) : '';
  const decodedShipmentNumber =
    typeof shipmentNumber === 'string' ? safeDecode(shipmentNumber) : '';

  const [form, setForm] = useState<FeedbackFormState>(createInitialForm);
  const [pickerField, setPickerField] = useState<DateField | null>(null);
  const autoEligibilityToastRef = useRef('');

  const {
    data: shipmentLookupData,
    error: shipmentLookupError,
    isError: isShipmentLookupError,
    isLoading: isShipmentLookupLoading,
    refetch: refetchShipmentLookup,
  } = useGetShipmentsByLogonQuery(decodedLogon, {
    skip: Boolean(decodedShipmentNumber) || !decodedLogon,
  });

  const resolvedShipmentNumber =
    decodedShipmentNumber || mapShipmentNumberByLogon(shipmentLookupData);

  const [createFeedback, { isLoading: isSubmitting }] = useCreateFeedbackMutation();
  const [runEligibilityCheck, eligibilityState] = useLazyPrecheckFeedbackEligibilityQuery();
  const pickerDate = useMemo(() => fromIsoDate(form.feedbackDate), [form.feedbackDate]);
  const eligibilityResult = useMemo<ShipmentFeedbackEligibilityResult | null>(() => {
    if (!eligibilityState.data) return null;
    return mapShipmentFeedbackEligibility(eligibilityState.data);
  }, [eligibilityState.data]);

  const setField = <K extends keyof FeedbackFormState>(field: K, value: FeedbackFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const showFeedbackToast = useCallback(
    (message: string, tone: 'success' | 'warning' | 'danger' | 'info' = 'danger') => {
      showToast({ message, tone });
    },
    [showToast],
  );

  const onChangePicker = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setPickerField(null);
    }

    if (event.type === 'dismissed' || !selectedDate || !pickerField) return;
    setField('feedbackDate', toIsoDate(selectedDate));
  };

  const checkEligibility = useCallback(async (): Promise<{
    eligible: boolean;
    message?: string;
  }> => {
    if (!decodedLogon) {
      return { eligible: false, message: 'Missing shipment logon.' };
    }

    if (!resolvedShipmentNumber) {
      return {
        eligible: false,
        message:
          'Could not resolve shipment number for this logon. Please retry from the shipment list or All Feedback page.',
      };
    }

    try {
      const response = await runEligibilityCheck({
        logon: decodedLogon,
        shipmentNumber: resolvedShipmentNumber,
      }).unwrap();

      const result = mapShipmentFeedbackEligibility(response);
      if (!result.eligible) {
        return {
          eligible: false,
          message: getShipmentFeedbackEligibilityMessage(result),
        };
      }

      return { eligible: true };
    } catch (error) {
      return {
        eligible: false,
        message: getShipmentFeedbackApiErrorMessage(
          error,
          'We could not complete the feedback eligibility check right now. Please try again.',
          'eligibility',
        ),
      };
    }
  }, [decodedLogon, resolvedShipmentNumber, runEligibilityCheck]);

  useEffect(() => {
    if (!decodedLogon || !resolvedShipmentNumber) return;

    let active = true;

    checkEligibility().then((result) => {
      if (!active) return;
      if (result.eligible) {
        autoEligibilityToastRef.current = '';
        return;
      }
      if (!result.message) return;
      if (autoEligibilityToastRef.current === result.message) return;
      autoEligibilityToastRef.current = result.message;
      showFeedbackToast(result.message, 'warning');
    });

    return () => {
      active = false;
    };
  }, [checkEligibility, decodedLogon, resolvedShipmentNumber, showFeedbackToast]);

  const handleSubmit = async () => {
    if (!decodedLogon) {
      showFeedbackToast('Missing shipment logon.', 'warning');
      return;
    }

    if (!form.feedbackDate.trim()) {
      showFeedbackToast('Feedback date is required.', 'warning');
      return;
    }

    if (!form.driverFeedbackText.trim()) {
      showFeedbackToast('Driver feedback is required.', 'warning');
      return;
    }

    const numericValues = [
      parseOptionalNumber(form.distanceCovered, 'Distance covered'),
      parseOptionalNumber(form.unknownDistanceCovered, 'Unknown distance covered'),
      parseOptionalNumber(form.driverScoreOnArrival, 'Driver score on arrival'),
      parseOptionalNumber(form.hosHoursManual, 'HOS hours'),
      parseOptionalNumber(form.violationsTotalManual, 'Total violations', { integer: true }),
      parseOptionalNumber(form.violationsOsManual, 'OS violations', { integer: true }),
      parseOptionalNumber(form.violationsHbManual, 'HB violations', { integer: true }),
      parseOptionalNumber(form.violationsHaManual, 'HA violations', { integer: true }),
      parseOptionalNumber(form.violationsCdManual, 'CD violations', { integer: true }),
    ];

    const invalidNumeric = numericValues.find((entry) => entry.error);
    if (invalidNumeric?.error) {
      showFeedbackToast(invalidNumeric.error, 'warning');
      return;
    }

    const eligibility = await checkEligibility();
    if (!eligibility.eligible) {
      showFeedbackToast(
        eligibility.message ?? 'This shipment is not eligible for feedback yet.',
        'warning',
      );
      return;
    }

    const payload: ShipmentFeedbackCreateRequest = {
      logon: decodedLogon,
      shipmentNumber: resolvedShipmentNumber || undefined,
      feedbackDate: form.feedbackDate,
      driverFeedbackText: form.driverFeedbackText.trim(),
      otherInformationText: form.otherInformationText.trim() || undefined,
      delayAtCustomer: form.delayAtCustomer ?? undefined,
      tamperingObserved: form.tamperingObserved ?? undefined,
      distanceCovered: numericValues[0].value,
      unknownDistanceCovered: numericValues[1].value,
      driverScoreOnArrival: numericValues[2].value,
      driverArrivalRating: form.driverArrivalRating || undefined,
      driverBehaviour: form.driverBehaviour.trim() || undefined,
      remedialAction: form.remedialAction.trim() || undefined,
      otherRemarks: form.otherRemarks.trim() || undefined,
      consequenceDue: form.consequenceDue ?? undefined,
      consequenceApplied: form.consequenceApplied.trim() || undefined,
      hosHoursManual: numericValues[3].value,
      violationsTotalManual: numericValues[4].value,
      violationsOsManual: numericValues[5].value,
      violationsHbManual: numericValues[6].value,
      violationsHaManual: numericValues[7].value,
      violationsCdManual: numericValues[8].value,
      manualOverrideReason: form.manualOverrideReason.trim() || undefined,
    };

    try {
      await createFeedback(payload).unwrap();
      showFeedbackToast('Feedback created successfully.', 'success');
      router.replace(`/(tabs)/shipments/feedback/${encodeURIComponent(decodedLogon)}` as any);
    } catch (error) {
      const message = getShipmentFeedbackApiErrorMessage(
        error,
        'Failed to create feedback.',
        'create',
      );
      if (message.toLowerCase().includes('already exists')) {
        showFeedbackToast(message, 'info');
        router.replace(`/(tabs)/shipments/feedback/${encodeURIComponent(decodedLogon)}` as any);
        return;
      }
      showFeedbackToast(message, 'danger');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Feedback</Text>
        <View style={{ width: 32 }} />
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

      <ScrollView contentContainerStyle={styles.content}>
        {isShipmentLookupLoading ? (
          <>
            <SkeletonLoader width="100%" height={120} style={{ marginBottom: spacing.base }} />
            <SkeletonLoader width="100%" height={160} />
          </>
        ) : isShipmentLookupError ? (
          <ErrorView
            message={getShipmentFeedbackApiErrorMessage(
              shipmentLookupError,
              'Could not resolve shipment reference.',
              'load',
            )}
            onRetry={refetchShipmentLookup}
          />
        ) : !resolvedShipmentNumber ? (
          <ErrorView
            message="Could not resolve shipment number for this logon. Please retry from the shipment list or All Feedback page."
            onRetry={refetchShipmentLookup}
          />
        ) : (
          <>
            <Card variant="elevated" padding="base">
              <Text style={styles.summaryLabel}>Shipment Logon</Text>
              <Text style={styles.summaryValue}>{decodedLogon}</Text>
              {resolvedShipmentNumber ? (
                <>
                  <Text style={[styles.summaryLabel, styles.summaryLabelSpacing]}>
                    Shipment Number
                  </Text>
                  <Text style={styles.summarySecondaryValue}>{resolvedShipmentNumber}</Text>
                </>
              ) : null}

              {eligibilityState.isFetching ? (
                <Text style={styles.summaryHint}>Checking feedback eligibility for this shipment.</Text>
              ) : eligibilityState.isError ? (
                <View style={styles.warningBanner}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={colors.warning}
                  />
                  <Text style={styles.warningText}>
                    {getShipmentFeedbackApiErrorMessage(
                      eligibilityState.error,
                      'We could not complete the feedback eligibility check right now. Please try again.',
                      'eligibility',
                    )}
                  </Text>
                </View>
              ) : eligibilityResult && !eligibilityResult.eligible ? (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning-outline" size={18} color={colors.warning} />
                  <Text style={styles.warningText}>
                    {getShipmentFeedbackEligibilityMessage(eligibilityResult)}
                  </Text>
                </View>
              ) : eligibilityResult?.eligible ? (
                <Text style={styles.summaryHint}>
                  Eligibility confirmed. The check will run again before submission.
                </Text>
              ) : null}
            </Card>

            <Section title="Feedback Form" subtitle="Fill in trip feedback details.">
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Feedback Date *</Text>
                <DateChip value={form.feedbackDate} onPress={() => setPickerField('feedbackDate')} />
              </View>
              <TextAreaField
                label="Driver Feedback"
                required
                value={form.driverFeedbackText}
                onChangeText={(value) => setField('driverFeedbackText', value)}
                placeholder="Describe the trip outcome and driver feedback"
              />
              <TextAreaField
                label="Other Information"
                value={form.otherInformationText}
                onChangeText={(value) => setField('otherInformationText', value)}
                placeholder="Add contextual notes"
              />
              <TextAreaField
                label="Other Remarks"
                value={form.otherRemarks}
                onChangeText={(value) => setField('otherRemarks', value)}
                placeholder="Any additional remarks"
              />
            </Section>

            <Section title="Observed Conditions">
              <BooleanField
                label="Delay At Customer"
                value={form.delayAtCustomer}
                onChange={(value) => setField('delayAtCustomer', value)}
              />
              <BooleanField
                label="Tampering Observed"
                value={form.tamperingObserved}
                onChange={(value) => setField('tamperingObserved', value)}
              />
              <RatingField
                value={form.driverArrivalRating}
                onChange={(value) => setField('driverArrivalRating', value)}
              />
              <TextField
                label="Driver Behaviour"
                value={form.driverBehaviour}
                onChangeText={(value) => setField('driverBehaviour', value)}
                placeholder="COMPLIANT"
              />
              <TextField
                label="Remedial Action"
                value={form.remedialAction}
                onChangeText={(value) => setField('remedialAction', value)}
                placeholder="NONE"
              />
            </Section>

            <Section title="Metrics">
              <TextField
                label="Distance Covered"
                value={form.distanceCovered}
                onChangeText={(value) => setField('distanceCovered', value)}
                placeholder="142.5"
                keyboardType="numeric"
              />
              <TextField
                label="Unknown Distance Covered"
                value={form.unknownDistanceCovered}
                onChangeText={(value) => setField('unknownDistanceCovered', value)}
                placeholder="3.2"
                keyboardType="numeric"
              />
              <TextField
                label="Driver Score On Arrival"
                value={form.driverScoreOnArrival}
                onChangeText={(value) => setField('driverScoreOnArrival', value)}
                placeholder="85"
                keyboardType="numeric"
              />
              <TextField
                label="HOS Hours (Manual)"
                value={form.hosHoursManual}
                onChangeText={(value) => setField('hosHoursManual', value)}
                placeholder="9.5"
                keyboardType="numeric"
              />
            </Section>

            <Section title="Violations">
              <TextField
                label="Total Violations"
                value={form.violationsTotalManual}
                onChangeText={(value) => setField('violationsTotalManual', value)}
                placeholder="1"
                keyboardType="numeric"
              />
              <TextField
                label="OS Violations"
                value={form.violationsOsManual}
                onChangeText={(value) => setField('violationsOsManual', value)}
                placeholder="1"
                keyboardType="numeric"
              />
              <TextField
                label="HB Violations"
                value={form.violationsHbManual}
                onChangeText={(value) => setField('violationsHbManual', value)}
                placeholder="0"
                keyboardType="numeric"
              />
              <TextField
                label="HA Violations"
                value={form.violationsHaManual}
                onChangeText={(value) => setField('violationsHaManual', value)}
                placeholder="0"
                keyboardType="numeric"
              />
              <TextField
                label="CD Violations"
                value={form.violationsCdManual}
                onChangeText={(value) => setField('violationsCdManual', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Section>

            <Section title="Consequence and Override">
              <BooleanField
                label="Consequence Due"
                value={form.consequenceDue}
                onChange={(value) => setField('consequenceDue', value)}
              />
              <TextField
                label="Consequence Applied"
                value={form.consequenceApplied}
                onChangeText={(value) => setField('consequenceApplied', value)}
                placeholder="Coaching session"
              />
              <TextAreaField
                label="Manual Override Reason"
                value={form.manualOverrideReason}
                onChangeText={(value) => setField('manualOverrideReason', value)}
                placeholder="Explain any manual overrides"
              />
            </Section>

            <View style={styles.footerActions}>
              <Button title="Cancel" variant="secondary" fullWidth onPress={() => router.back()} />
              <Button title="Create Feedback" fullWidth loading={isSubmitting} onPress={handleSubmit} />
            </View>
          </>
        )}

        {pickerField && Platform.OS === 'ios' ? (
          <Card variant="default" padding="base">
            <DateTimePicker
              mode="date"
              display="spinner"
              value={pickerDate}
              onChange={onChangePicker}
              maximumDate={new Date()}
            />
            <Button title="Done" size="sm" onPress={() => setPickerField(null)} />
          </Card>
        ) : null}
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
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  summarySecondaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  summaryLabelSpacing: {
    marginTop: spacing.base,
  },
  summaryHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.base,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warningLight,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  sectionBody: {
    gap: spacing.base,
    marginTop: spacing.base,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateChip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateChipValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  footerActions: {
    gap: spacing.sm,
  },
});
