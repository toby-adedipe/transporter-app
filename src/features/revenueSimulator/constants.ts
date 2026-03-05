import type {
  RevenueControlId,
  RevenueSimulatorControlDefinition,
  RevenueSimulatorControls,
  RevenueSimulatorQuickScenario,
  RevenueSimulatorSectionDefinition,
} from '@/features/revenueSimulator/types';

export const MIX_CONTROL_IDS = ['soMix', 'stpoMix', 'bulkMix'] as const;
export const VOLUME_CONTROL_IDS = ['cementVolume', 'backhaulVolume'] as const;
export const TRUCK_CONTROL_IDS = ['flatbedTrucks', 'bulkTrucks'] as const;
export const PAYLOAD_CONTROL_IDS = ['payloadSo', 'payloadStpo', 'payloadBulk'] as const;
export const TAT_PLANT_CONTROL_IDS = ['gateInGateOut', 'giyi', 'yardInWeighIn', 'wogo'] as const;
export const TAT_JOURNEY_CONTROL_IDS = [
  'leadtimeFbIn',
  'leadtimeFbOut',
  'yardTimeFb',
  'leadtimeBulkIn',
  'leadtimeBulkOut',
  'yardTimeBulk',
  'hosBlockedDriversImpact',
] as const;
export const TAT_CONTROL_IDS = [...TAT_PLANT_CONTROL_IDS, ...TAT_JOURNEY_CONTROL_IDS] as const;

export const ALL_REVENUE_CONTROL_IDS: RevenueControlId[] = [
  ...VOLUME_CONTROL_IDS,
  ...MIX_CONTROL_IDS,
  ...TRUCK_CONTROL_IDS,
  ...PAYLOAD_CONTROL_IDS,
  ...TAT_PLANT_CONTROL_IDS,
  ...TAT_JOURNEY_CONTROL_IDS,
];

export const FALLBACK_BASELINE_REVENUE = 230_830_000;
export const FALLBACK_BASELINE_FREIGHT_COST_PER_TON = 12_400;
export const FALLBACK_BASELINE_AVG_DISTANCE = 320;
export const FALLBACK_BASELINE_TRIPS_PER_TRUCK = 1.9;

export const FALLBACK_CONTROL_VALUES: RevenueSimulatorControls = {
  cementVolume: 20_000,
  backhaulVolume: 500,
  soMix: 30,
  stpoMix: 60,
  bulkMix: 10,
  flatbedTrucks: 42,
  bulkTrucks: 12,
  payloadSo: 40,
  payloadStpo: 47,
  payloadBulk: 45,
  gateInGateOut: 9.4,
  giyi: 2.2,
  yardInWeighIn: 1,
  wogo: 1.2,
  leadtimeFbIn: 22,
  leadtimeFbOut: 22,
  yardTimeFb: 15,
  leadtimeBulkIn: 43,
  leadtimeBulkOut: 43,
  yardTimeBulk: 10,
  hosBlockedDriversImpact: 24,
};

export const TAT_PLANT_TARGET_LABELS: Partial<Record<RevenueControlId, string>> = {
  gateInGateOut: 'target 4',
  giyi: 'target 1.5',
  yardInWeighIn: 'target 0.25',
  wogo: 'target 0.25',
};

export const REVENUE_CONTROL_DEFINITIONS: Record<RevenueControlId, RevenueSimulatorControlDefinition> = {
  cementVolume: {
    id: 'cementVolume',
    label: 'Cement Volume',
    unit: 'tons/mo',
    sectionId: 'volume',
    decimals: 0,
  },
  backhaulVolume: {
    id: 'backhaulVolume',
    label: 'Backhaul Volume',
    unit: 'tons/mo',
    sectionId: 'volume',
    decimals: 0,
  },
  soMix: {
    id: 'soMix',
    label: 'SO Mix',
    unit: '%',
    sectionId: 'volume',
    decimals: 1,
  },
  stpoMix: {
    id: 'stpoMix',
    label: 'STPO Mix',
    unit: '%',
    sectionId: 'volume',
    decimals: 1,
  },
  bulkMix: {
    id: 'bulkMix',
    label: 'Bulk Mix',
    unit: '%',
    sectionId: 'volume',
    decimals: 1,
  },
  payloadSo: {
    id: 'payloadSo',
    label: 'Payload SO',
    unit: 't/trip',
    sectionId: 'payload',
    decimals: 1,
  },
  payloadStpo: {
    id: 'payloadStpo',
    label: 'Payload STPO',
    unit: 't/trip',
    sectionId: 'payload',
    decimals: 1,
  },
  payloadBulk: {
    id: 'payloadBulk',
    label: 'Payload Bulk',
    unit: 't/trip',
    sectionId: 'payload',
    decimals: 1,
  },
  flatbedTrucks: {
    id: 'flatbedTrucks',
    label: 'Flatbed Trucks',
    unit: 'trucks',
    sectionId: 'fleet',
    decimals: 0,
  },
  bulkTrucks: {
    id: 'bulkTrucks',
    label: 'Bulk Trucks',
    unit: 'trucks',
    sectionId: 'fleet',
    decimals: 0,
  },
  gateInGateOut: {
    id: 'gateInGateOut',
    label: 'Gate-In Gate-Out',
    unit: 'hrs',
    sectionId: 'tatPlant',
    decimals: 1,
  },
  giyi: {
    id: 'giyi',
    label: 'GIYI',
    unit: 'hrs',
    sectionId: 'tatPlant',
    decimals: 1,
  },
  yardInWeighIn: {
    id: 'yardInWeighIn',
    label: 'Yard-In Weigh-In',
    unit: 'hrs',
    sectionId: 'tatPlant',
    decimals: 1,
  },
  wogo: {
    id: 'wogo',
    label: 'WOGO',
    unit: 'hrs',
    sectionId: 'tatPlant',
    decimals: 1,
  },
  leadtimeFbIn: {
    id: 'leadtimeFbIn',
    label: 'Leadtime FB In',
    unit: 'hrs',
    sectionId: 'tatJourney',
    decimals: 1,
  },
  leadtimeFbOut: {
    id: 'leadtimeFbOut',
    label: 'Leadtime FB Out',
    unit: 'hrs',
    sectionId: 'tatJourney',
    decimals: 1,
  },
  yardTimeFb: {
    id: 'yardTimeFb',
    label: 'Yard Time FB',
    unit: 'hrs',
    sectionId: 'tatJourney',
    decimals: 1,
  },
  leadtimeBulkIn: {
    id: 'leadtimeBulkIn',
    label: 'Leadtime Bulk In',
    unit: 'hrs',
    sectionId: 'tatJourney',
    decimals: 1,
  },
  leadtimeBulkOut: {
    id: 'leadtimeBulkOut',
    label: 'Leadtime Bulk Out',
    unit: 'hrs',
    sectionId: 'tatJourney',
    decimals: 1,
  },
  yardTimeBulk: {
    id: 'yardTimeBulk',
    label: 'Yard Time Bulk',
    unit: 'hrs',
    sectionId: 'tatJourney',
    decimals: 1,
  },
  hosBlockedDriversImpact: {
    id: 'hosBlockedDriversImpact',
    label: 'HOS (Blocked Drivers Impact)',
    unit: 'index',
    sectionId: 'tatJourney',
    decimals: 1,
  },
};

export const REVENUE_SIMULATOR_SECTIONS: RevenueSimulatorSectionDefinition[] = [
  {
    id: 'volume',
    title: 'Volume',
    controlIds: [...VOLUME_CONTROL_IDS, ...MIX_CONTROL_IDS],
  },
  {
    id: 'payload',
    title: 'Payload',
    controlIds: [...PAYLOAD_CONTROL_IDS],
  },
  {
    id: 'fleet',
    title: 'Fleet',
    controlIds: [...TRUCK_CONTROL_IDS],
  },
  {
    id: 'tatPlant',
    title: 'TAT - Plant',
    controlIds: [...TAT_PLANT_CONTROL_IDS],
  },
  {
    id: 'tatJourney',
    title: 'TAT - Journey & Customer',
    controlIds: [...TAT_JOURNEY_CONTROL_IDS],
  },
];

export const QUICK_SCENARIOS: RevenueSimulatorQuickScenario[] = [
  { id: 'add_trucks', label: 'Add 10 Trucks', icon: 'bus-outline' },
  { id: 'cut_tat_10', label: 'Cut TAT 10%', icon: 'speedometer-outline' },
  { id: 'boost_volume_10', label: 'Boost Volume 10%', icon: 'cube-outline' },
];

export interface RevenueControlBoundConfig {
  minFactor: number;
  maxFactor: number;
  step: number;
  absoluteMin?: number;
  absoluteMax?: number;
}

const MIX_BOUND: RevenueControlBoundConfig = {
  minFactor: 0,
  maxFactor: 1,
  step: 1,
  absoluteMin: 0,
  absoluteMax: 100,
};

const VOLUME_BOUND: RevenueControlBoundConfig = {
  minFactor: 0,
  maxFactor: 3,
  step: 10,
  absoluteMin: 0,
};

const TRUCK_BOUND: RevenueControlBoundConfig = {
  minFactor: 0,
  maxFactor: 3,
  step: 1,
  absoluteMin: 0,
};

const PAYLOAD_BOUND: RevenueControlBoundConfig = {
  minFactor: 0.5,
  maxFactor: 1.5,
  step: 0.1,
  absoluteMin: 0,
};

const TAT_BOUND: RevenueControlBoundConfig = {
  minFactor: 0.4,
  maxFactor: 1.6,
  step: 0.1,
  absoluteMin: 0,
};

export const CONTROL_BOUND_CONFIG: Record<RevenueControlId, RevenueControlBoundConfig> = {
  cementVolume: VOLUME_BOUND,
  backhaulVolume: VOLUME_BOUND,
  soMix: MIX_BOUND,
  stpoMix: MIX_BOUND,
  bulkMix: MIX_BOUND,
  flatbedTrucks: TRUCK_BOUND,
  bulkTrucks: TRUCK_BOUND,
  payloadSo: PAYLOAD_BOUND,
  payloadStpo: PAYLOAD_BOUND,
  payloadBulk: PAYLOAD_BOUND,
  gateInGateOut: TAT_BOUND,
  giyi: TAT_BOUND,
  yardInWeighIn: TAT_BOUND,
  wogo: TAT_BOUND,
  leadtimeFbIn: TAT_BOUND,
  leadtimeFbOut: TAT_BOUND,
  yardTimeFb: TAT_BOUND,
  leadtimeBulkIn: TAT_BOUND,
  leadtimeBulkOut: TAT_BOUND,
  yardTimeBulk: TAT_BOUND,
  hosBlockedDriversImpact: TAT_BOUND,
};
