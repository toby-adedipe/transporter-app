import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '@/components/ui';
import {
  FALLBACK_CONTROL_VALUES,
  QUICK_SCENARIOS,
  REVENUE_CONTROL_DEFINITIONS,
  TAT_PLANT_TARGET_LABELS,
} from '@/features/revenueSimulator/constants';
import {
  applyScenario,
  clampControlsToBounds,
  computeRevenueProjection,
  isMixControl,
  resolveControlBounds,
} from '@/features/revenueSimulator/formula';
import {
  applyMixControlChange,
  clampNumber,
  formatCompactCurrency,
  formatNumber,
  formatNumberWithUnit,
  formatPercent,
  getCurrentMonthDateRange,
  normalizeMixControls,
  roundTo,
  safeDivide,
} from '@/features/revenueSimulator/format';
import { mapAggregatedToBaseline } from '@/features/revenueSimulator/mapper';
import type {
  MixControlId,
  RevenueControlId,
  RevenueSimulatorControls,
} from '@/features/revenueSimulator/types';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useGetKpiV2AggregatedQuery } from '@/store/api/kpiApi';
import type { KpiV2AggregatedResult, Region } from '@/types/api';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/constants/theme';

const VALID_REGIONS = new Set<Region>(['NORTH', 'WEST', 'EAST', 'LAGOS']);

const CONTROL_ORDER = {
  volume: ['cementVolume', 'backhaulVolume'] as RevenueControlId[],
  mix: ['soMix', 'stpoMix', 'bulkMix'] as RevenueControlId[],
  payload: ['payloadSo', 'payloadStpo', 'payloadBulk'] as RevenueControlId[],
  fleet: ['flatbedTrucks', 'bulkTrucks'] as RevenueControlId[],
  tatPlant: ['gateInGateOut', 'giyi', 'yardInWeighIn', 'wogo'] as RevenueControlId[],
  tatJourney: [
    'leadtimeFbIn',
    'leadtimeFbOut',
    'yardTimeFb',
    'leadtimeBulkIn',
    'leadtimeBulkOut',
    'yardTimeBulk',
    'hosBlockedDriversImpact',
  ] as RevenueControlId[],
};

const EDITABLE_SECTION_ORDER = ['volume', 'payload', 'fleet', 'tatPlant', 'tatJourney'] as const;
type EditableSectionId = (typeof EDITABLE_SECTION_ORDER)[number];

const SECTION_META: Record<
  EditableSectionId,
  { title: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  volume: { title: 'Volume', icon: 'cube-outline' },
  payload: { title: 'Payload', icon: 'scale-outline' },
  fleet: { title: 'Fleet', icon: 'bus-outline' },
  tatPlant: { title: 'TAT - Plant', icon: 'business-outline' },
  tatJourney: { title: 'TAT - Journey & Customer', icon: 'timer-outline' },
};

const getSectionControlIds = (sectionId: EditableSectionId): RevenueControlId[] => {
  if (sectionId === 'volume') {
    return [...CONTROL_ORDER.volume, ...CONTROL_ORDER.mix];
  }
  return CONTROL_ORDER[sectionId];
};

const getErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'Unable to load simulator data';

  if ('error' in error && typeof (error as { error?: unknown }).error === 'string') {
    return (error as { error: string }).error;
  }

  const dataMessage = (error as { data?: { message?: string } }).data?.message;
  if (typeof dataMessage === 'string' && dataMessage.trim()) {
    return dataMessage;
  }

  return 'Unable to load simulator data';
};

interface SimulatorSliderProps {
  style?: unknown;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
}

const FallbackSlider = ({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor = colors.primary,
  maximumTrackTintColor = colors.border,
}: SimulatorSliderProps) => {
  const range = Math.max(maximumValue - minimumValue, 0.0001);
  const ratio = clampNumber(
    safeDivide(value - minimumValue, range, 0),
    0,
    1,
  );

  const stepValue = Math.max(step, 0.0001);
  const move = (direction: 1 | -1) => {
    const nextValue = clampNumber(
      value + direction * stepValue,
      minimumValue,
      maximumValue,
    );
    onValueChange(nextValue);
    onSlidingComplete?.(nextValue);
  };

  return (
    <View style={styles.fallbackSliderRow}>
      <TouchableOpacity
        style={styles.fallbackSliderButton}
        onPress={() => move(-1)}
        activeOpacity={0.8}
      >
        <Ionicons name="remove" size={16} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={[styles.fallbackTrack, { backgroundColor: maximumTrackTintColor }]}>
        <View
          style={[
            styles.fallbackTrackFill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: minimumTrackTintColor,
            },
          ]}
        />
      </View>
      <TouchableOpacity
        style={styles.fallbackSliderButton}
        onPress={() => move(1)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={16} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
};

let Slider: React.ComponentType<SimulatorSliderProps> = FallbackSlider;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const sliderModule = require('@react-native-community/slider');
  Slider = (sliderModule.default ??
    sliderModule) as React.ComponentType<SimulatorSliderProps>;
} catch {
  Slider = FallbackSlider;
}

export default function RevenueSimulatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const transporterFromSession = useTransporterNumber();
  const activeTransporterNumber = (transporterFromSession ?? '').trim();
  const selectedRegion = useAppSelector((state) => state.filters.selectedRegion);
  const currentMonthRange = React.useMemo(() => getCurrentMonthDateRange(), []);

  const [lastSuccessfulPayload, setLastSuccessfulPayload] =
    React.useState<KpiV2AggregatedResult | null>(null);
  const [controls, setControls] = React.useState<RevenueSimulatorControls>(
    FALLBACK_CONTROL_VALUES,
  );
  const [expandedSections, setExpandedSections] = React.useState<EditableSectionId[]>([]);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const lastHydratedQueryKeyRef = React.useRef<string | null>(null);
  const forceHydrateFromPayloadRef = React.useRef(true);

  const regions = React.useMemo(() => {
    const normalizedRegion = (selectedRegion ?? '').toUpperCase() as Region;
    if (normalizedRegion === 'ALL') return undefined;
    if (VALID_REGIONS.has(normalizedRegion)) return [normalizedRegion];
    return undefined;
  }, [selectedRegion]);

  const queryArgs = React.useMemo(
    () => ({
      startDate: currentMonthRange.startDate,
      endDate: currentMonthRange.endDate,
      transporterNumbers: activeTransporterNumber
        ? [activeTransporterNumber]
        : undefined,
      regions,
    }),
    [activeTransporterNumber, currentMonthRange.endDate, currentMonthRange.startDate, regions],
  );
  const queryHydrationKey = React.useMemo(
    () =>
      [
        activeTransporterNumber,
        currentMonthRange.startDate,
        currentMonthRange.endDate,
        regions?.join(',') ?? 'ALL',
      ].join('|'),
    [
      activeTransporterNumber,
      currentMonthRange.endDate,
      currentMonthRange.startDate,
      regions,
    ],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetKpiV2AggregatedQuery(queryArgs, {
    skip: !activeTransporterNumber,
  });

  React.useEffect(() => {
    const result = data?.result;
    if (!result) return;

    const mapped = mapAggregatedToBaseline(result);
    setLastSuccessfulPayload(result);
    const shouldHydrateControls =
      forceHydrateFromPayloadRef.current ||
      lastHydratedQueryKeyRef.current !== queryHydrationKey;
    if (shouldHydrateControls) {
      setControls(mapped.controls);
      lastHydratedQueryKeyRef.current = queryHydrationKey;
      forceHydrateFromPayloadRef.current = false;
    }
    setWarningMessage(null);
  }, [data?.result, queryHydrationKey]);

  React.useEffect(() => {
    if (activeTransporterNumber) return;
    setLastSuccessfulPayload(null);
    setWarningMessage(null);
    lastHydratedQueryKeyRef.current = null;
    forceHydrateFromPayloadRef.current = true;
    setExpandedSections([]);
  }, [activeTransporterNumber]);

  const baseline = React.useMemo(() => {
    if (!lastSuccessfulPayload) return null;
    return mapAggregatedToBaseline(lastSuccessfulPayload);
  }, [lastSuccessfulPayload]);

  const projection = React.useMemo(() => {
    if (!baseline) return null;
    return computeRevenueProjection(baseline, controls);
  }, [baseline, controls]);

  const estimatedControlIds = React.useMemo(
    () => new Set<RevenueControlId>(baseline?.estimatedControlIds ?? []),
    [baseline?.estimatedControlIds],
  );

  React.useEffect(() => {
    if (!isError) return;
    const message = getErrorMessage(error);

    if (baseline) {
      setWarningMessage(
        `Unable to refresh simulator data for transporter ${activeTransporterNumber}. Showing the last successful snapshot.`,
      );
      return;
    }

    setWarningMessage(message);
  }, [activeTransporterNumber, baseline, error, isError]);

  const handleBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/kpi');
  }, [router]);

  const updateControls = React.useCallback(
    (
      updater: (
        current: RevenueSimulatorControls,
      ) => RevenueSimulatorControls,
    ) => {
      setControls((current) => {
        if (!baseline) return current;
        const updated = updater({ ...current });
        const normalized = normalizeMixControls(updated);
        return clampControlsToBounds(normalized, baseline.controls);
      });
    },
    [baseline],
  );

  const handleControlChange = React.useCallback(
    (controlId: RevenueControlId, value: number) => {
      updateControls((current) => {
        if (isMixControl(controlId)) {
          return applyMixControlChange(
            current,
            controlId as MixControlId,
            value,
          );
        }

        current[controlId] = value;
        return current;
      });
    },
    [updateControls],
  );

  const handleScenario = React.useCallback(
    (scenarioId: (typeof QUICK_SCENARIOS)[number]['id']) => {
      updateControls((current) => applyScenario(scenarioId, current));
    },
    [updateControls],
  );

  const handleResetToActual = React.useCallback(() => {
    if (!baseline) return;
    setControls(baseline.controls);
  }, [baseline]);

  const toggleSection = React.useCallback((sectionId: EditableSectionId) => {
    setExpandedSections((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId],
    );
  }, []);

  const onRefresh = React.useCallback(async () => {
    if (!activeTransporterNumber) return;
    forceHydrateFromPayloadRef.current = true;
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [activeTransporterNumber, refetch]);

  const renderSliderControl = React.useCallback(
    (controlId: RevenueControlId) => {
      if (!baseline) return null;
      const control = REVENUE_CONTROL_DEFINITIONS[controlId];
      const baselineValue = baseline.controls[controlId];
      const currentValue = controls[controlId];
      const bounds = resolveControlBounds(controlId, baselineValue);

      return (
        <View key={controlId} style={styles.controlBlock}>
          <View style={styles.controlHeaderRow}>
            <View style={styles.controlTitleWrap}>
              <Text style={styles.controlLabel}>{control.label}</Text>
              <Text style={styles.controlUnit}>{control.unit}</Text>
              {estimatedControlIds.has(controlId) ? (
                <Badge
                  label="estimated"
                  color={colors.warning}
                  bgColor={colors.warningLight}
                />
              ) : null}
            </View>
            <View style={styles.controlValueWrap}>
              <Text style={styles.controlActualText}>
                actual {formatNumber(baselineValue, control.decimals)}
              </Text>
              <Text style={styles.controlCurrentValue}>
                {formatNumber(currentValue, control.decimals)}
              </Text>
            </View>
          </View>

          <Slider
            style={styles.slider}
            value={currentValue}
            minimumValue={bounds.min}
            maximumValue={bounds.max}
            step={bounds.step}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.surface}
            onValueChange={(value: number) => handleControlChange(controlId, value)}
            onSlidingComplete={(value: number) => handleControlChange(controlId, value)}
          />

          {TAT_PLANT_TARGET_LABELS[controlId] ? (
            <Text style={styles.targetText}>
              {TAT_PLANT_TARGET_LABELS[controlId]}
            </Text>
          ) : null}
        </View>
      );
    },
    [baseline, controls, estimatedControlIds, handleControlChange],
  );

  const renderEditableSection = React.useCallback(
    (sectionId: EditableSectionId) => {
      if (!baseline || !projection) return null;
      const meta = SECTION_META[sectionId];
      const isExpanded = expandedSections.includes(sectionId);
      const sectionControlIds = getSectionControlIds(sectionId);
      const changedCount = sectionControlIds.reduce((count, controlId) => {
        const currentValue = controls[controlId];
        const baselineValue = baseline.controls[controlId];
        return Math.abs(currentValue - baselineValue) >= 0.001 ? count + 1 : count;
      }, 0);

      return (
        <Card key={sectionId} variant="default" padding="base">
          <TouchableOpacity
            style={styles.editSectionHeader}
            activeOpacity={0.85}
            onPress={() => toggleSection(sectionId)}
          >
            <View style={styles.editSectionHeaderLeft}>
              <View style={styles.editSectionIconWrap}>
                <Ionicons name={meta.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.editSectionTextWrap}>
                <Text style={styles.editSectionTitle}>{meta.title}</Text>
                <Text style={styles.editSectionSubtitle}>
                  {changedCount > 0
                    ? `${changedCount} adjusted`
                    : `${sectionControlIds.length} controls`}
                </Text>
              </View>
            </View>
            <View style={styles.editSectionHeaderRight}>
              {!isExpanded ? (
                <Text style={styles.editSectionTapHint}>Tap to edit</Text>
              ) : null}
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {isExpanded ? (
            <View style={styles.editSectionBody}>
              {sectionId === 'volume' ? (
                <>
                  {CONTROL_ORDER.volume.map((controlId) => renderSliderControl(controlId))}
                  <View style={styles.mixRow}>
                    {CONTROL_ORDER.mix.map((mixId) => {
                      const control = REVENUE_CONTROL_DEFINITIONS[mixId];
                      return (
                        <View key={mixId} style={styles.mixChip}>
                          <Text style={styles.mixLabel}>{control.label}</Text>
                          <TextInput
                            style={styles.mixInput}
                            keyboardType="decimal-pad"
                            value={formatNumber(controls[mixId], 1)}
                            onChangeText={(text) => {
                              const parsed = Number(text.replace(/[^0-9.]/g, ''));
                              handleControlChange(mixId, Number.isFinite(parsed) ? parsed : 0);
                            }}
                          />
                          <Text style={styles.mixSuffix}>%</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {sectionId === 'payload'
                ? CONTROL_ORDER.payload.map((controlId) => renderSliderControl(controlId))
                : null}

              {sectionId === 'fleet'
                ? CONTROL_ORDER.fleet.map((controlId) => renderSliderControl(controlId))
                : null}

              {sectionId === 'tatPlant'
                ? CONTROL_ORDER.tatPlant.map((controlId) => renderSliderControl(controlId))
                : null}

              {sectionId === 'tatJourney' ? (
                <>
                  {CONTROL_ORDER.tatJourney.map((controlId) => renderSliderControl(controlId))}
                  <View style={styles.footerKpiRow}>
                    <View style={styles.footerKpiChip}>
                      <Text style={styles.footerKpiLabel}>CUSTOMER CICO (FB)</Text>
                      <Text style={styles.footerKpiValue}>
                        {formatNumber(projection.footerKpis.customerCicoFb, 1)} hrs
                      </Text>
                    </View>
                    <View style={styles.footerKpiChip}>
                      <Text style={styles.footerKpiLabel}>CUSTOMER CICO (BULK)</Text>
                      <Text style={styles.footerKpiValue}>
                        {formatNumber(projection.footerKpis.customerCicoBulk, 1)} hrs
                      </Text>
                    </View>
                    <View style={styles.footerKpiChip}>
                      <Text style={styles.footerKpiLabel}>DEPOT CICO</Text>
                      <Text style={styles.footerKpiValue}>
                        {formatNumber(projection.footerKpis.depotCico, 1)} hrs
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </Card>
      );
    },
    [
      baseline,
      controls,
      expandedSections,
      handleControlChange,
      projection,
      renderSliderControl,
      toggleSection,
    ],
  );

  const noTransporterAvailable = !activeTransporterNumber;

  const heroStatusColor =
    projection?.statusTone === 'success'
      ? colors.success
      : projection?.statusTone === 'warning'
        ? colors.warning
        : colors.danger;

  const revenueRatio = projection
    ? safeDivide(
        projection.projectedRevenue,
        Math.max(projection.actualRevenue, 1),
        1,
      )
    : 1;
  const revenueDeltaPercent = (revenueRatio - 1) * 100;
  const heroRatio = clampNumber(revenueRatio, 0.5, 1.5);
  const needleRotation = `${roundTo(((heroRatio - 0.5) / 1) * 180 - 90, 1)}deg`;

  const showBlockingLoadState = !baseline && isLoading;
  const showBlockingErrorState = !baseline && isError;
  const showSimulator = Boolean(activeTransporterNumber && baseline && projection);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Revenue Simulator</Text>
          <Text style={styles.headerSubtitle}>Model KPI changes and projected revenue</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isFetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {warningMessage ? (
          <Card variant="default" padding="base" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={styles.warningTitle}>Data Warning</Text>
            </View>
            <Text style={styles.warningText}>{warningMessage}</Text>
          </Card>
        ) : null}

        {noTransporterAvailable ? (
          <Card variant="default" padding="base">
            <EmptyState
              icon="person-outline"
              title="Transporter unavailable"
              subtitle="Sign in with a transporter account to load simulator data."
            />
          </Card>
        ) : null}

        {showBlockingLoadState ? (
          <>
            <Card variant="default" padding="base">
              <SkeletonLoader width="100%" height={210} />
            </Card>
            <Card variant="default" padding="base">
              <SkeletonLoader width="100%" height={360} />
            </Card>
          </>
        ) : null}

        {showBlockingErrorState ? (
          <Card variant="default" padding="base">
            <EmptyState
              icon="alert-circle-outline"
              title="Unable to load Revenue Simulator"
              subtitle={getErrorMessage(error)}
              actionLabel="Retry"
              onAction={() => {
                void refetch();
              }}
            />
          </Card>
        ) : null}

        {showSimulator && projection ? (
          <>
            <Card variant="default" padding="base" style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroLabel}>ACTUAL REVENUE</Text>
                  <Text style={styles.heroActualValue}>
                    {formatCompactCurrency(projection.actualRevenue)}
                  </Text>
                </View>
                <StatusBadge status={projection.statusTone} label={projection.statusLabel} />
              </View>

              <View style={styles.gaugeWrap}>
                <View style={styles.gaugeArc} />
                <View
                  style={[
                    styles.gaugeNeedle,
                    {
                      borderBottomColor: heroStatusColor,
                      transform: [{ rotate: needleRotation }],
                    },
                  ]}
                />
                <View style={[styles.gaugeCenter, { backgroundColor: heroStatusColor }]} />
              </View>

              <Text style={styles.heroProjectedValue}>
                {formatCompactCurrency(projection.projectedRevenue)}
              </Text>
              <Text style={styles.heroSubText}>PROJECTED MONTHLY REVENUE</Text>
              <Text
                style={[
                  styles.heroDeltaText,
                  { color: revenueDeltaPercent >= 0 ? '#6DE2A4' : '#FFC08A' },
                ]}
              >
                {`${revenueDeltaPercent >= 0 ? '+' : ''}${formatPercent(revenueDeltaPercent, 1)} vs actual`}
              </Text>
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.cardTitle}>Quick Scenarios</Text>
              <View style={styles.scenarioRow}>
                {QUICK_SCENARIOS.map((scenario) => (
                  <TouchableOpacity
                    key={scenario.id}
                    style={styles.scenarioButton}
                    activeOpacity={0.8}
                    onPress={() => handleScenario(scenario.id)}
                  >
                    <Ionicons
                      name={scenario.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={colors.surface}
                    />
                    <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.resetRow}>
                <Button
                  title="Reset to Actual"
                  variant="outline"
                  size="sm"
                  onPress={handleResetToActual}
                />
              </View>
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.cardTitle}>Fleet Capacity</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${roundTo(
                        clampNumber(projection.fleetCapacityProgress * 100, 0, 100),
                        1,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.capacityText}>
                {formatNumber(projection.projectedMonthlyVolume, 0)} /{' '}
                {formatNumber(projection.fleetCapacityTarget, 0)} t target
              </Text>
              <Text style={styles.capacityHint}>
                {projection.trucksNeeded > projection.availableTrucks
                  ? `Need ${projection.trucksNeeded - projection.availableTrucks} more trucks to hit target volume`
                  : 'Current fleet can support projected volume target'}
              </Text>
            </Card>

            <Card variant="default" padding="base">
              <Text style={styles.cardTitle}>Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Monthly Volume</Text>
                  <Text style={styles.summaryValue}>
                    {formatNumberWithUnit(projection.projectedMonthlyVolume, 't', 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Trips/Truck/Wk</Text>
                  <Text style={styles.summaryValue}>
                    {formatNumber(projection.projectedTripsPerTruckWeek, 2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Trucks Needed</Text>
                  <Text style={styles.summaryValue}>
                    {projection.trucksNeeded} / {projection.availableTrucks}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Utilization</Text>
                  <Text style={styles.summaryValue}>
                    {formatPercent(projection.utilizationPct, 1)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Distance</Text>
                  <Text style={styles.summaryValue}>
                    {formatNumberWithUnit(projection.avgDistance, 'km', 0)}
                  </Text>
                </View>
              </View>
            </Card>

            <View style={styles.editSectionsHeader}>
              <Text style={styles.editSectionsTitle}>Adjust Inputs</Text>
              {baseline?.criticalFallbackUsed ? (
                <Badge
                  label="Estimated baseline"
                  color={colors.warning}
                  bgColor={colors.warningLight}
                />
              ) : null}
            </View>
            {EDITABLE_SECTION_ORDER.map((sectionId) => renderEditableSection(sectionId))}
          </>
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  editSectionsHeader: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  editSectionsTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  editSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  editSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  editSectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  editSectionTextWrap: {
    flex: 1,
  },
  editSectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  editSectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editSectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editSectionTapHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  editSectionBody: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: colors.warningLight,
    backgroundColor: '#FFF9F0',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  controlBlock: {
    marginBottom: spacing.base,
  },
  controlHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  controlTitleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  controlLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  controlUnit: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
  },
  controlValueWrap: {
    alignItems: 'flex-end',
  },
  controlActualText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  controlCurrentValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  slider: {
    width: '100%',
    height: 36,
    marginTop: spacing.xs,
  },
  fallbackSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  fallbackSliderButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackTrack: {
    flex: 1,
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fallbackTrackFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  targetText: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  mixRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  mixChip: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  mixLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  mixInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
  },
  mixSuffix: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  heroCard: {
    backgroundColor: '#0F1F3A',
    borderWidth: 0,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    color: '#8FA4C2',
    fontSize: fontSize.xs,
    letterSpacing: 0.6,
  },
  heroActualValue: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    marginTop: spacing.xs,
  },
  gaugeWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 120,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  gaugeArc: {
    position: 'absolute',
    width: 180,
    height: 90,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    borderWidth: 10,
    borderBottomWidth: 0,
    borderColor: '#294266',
    top: 20,
  },
  gaugeNeedle: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 72,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    bottom: 8,
  },
  gaugeCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#0F1F3A',
    position: 'absolute',
    bottom: 4,
  },
  heroProjectedValue: {
    textAlign: 'center',
    color: colors.surface,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
  },
  heroSubText: {
    textAlign: 'center',
    color: '#8FA4C2',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    letterSpacing: 0.8,
  },
  heroDeltaText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
  footerKpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footerKpiChip: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  footerKpiLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  footerKpiValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  scenarioRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scenarioButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  scenarioLabel: {
    color: colors.surface,
    fontSize: fontSize.xs,
    textAlign: 'center',
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
  resetRow: {
    marginTop: spacing.md,
    alignItems: 'flex-end',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
  progressTrack: {
    width: '100%',
    height: 18,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: borderRadius.full,
  },
  capacityText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
  capacityHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
