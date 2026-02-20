// Standard API response wrapper
export interface AppResponse<T> {
  message: string;
  statusCode?: string;
  isSuccessful: boolean;
  time: string;
  result: T;
}

// Transporter Insights Chat
export type TransporterChatRole = 'user' | 'assistant' | 'system';

export interface TransporterChatMessage {
  role: TransporterChatRole;
  content: string;
}

export interface TransporterChatRequest {
  transporterNumber: string;
  messages: TransporterChatMessage[];
  startDate?: string;
  endDate?: string;
  region?: string;
  debug?: boolean;
  forceHandover?: boolean;
}

export interface TransporterChatResponse {
  isSuccessful: boolean;
  message: string;
  result: {
    reply: string;
    dataSources: string[];
    handoverTriggered?: boolean;
    handoverEmailSent?: boolean;
    handoverRecipient?: string;
    handoverReference?: string;
  };
}

// Transporter Insights Truck Search
export type TruckSearchItem = Record<string, unknown>;

export interface TruckMovementPoint {
  timestamp?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  status?: string;
  speed?: number;
}

export interface TruckDetailLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  updatedAt?: string;
  status?: string;
}

export interface TruckDetailShipment {
  reference?: string;
  status?: string;
  origin?: string;
  destination?: string;
  eta?: string;
  customer?: string;
  product?: string;
}

export interface TruckDetailViewModel {
  plate: string;
  requestedPlate: string;
  exactPlateMatch: boolean;
  fallbackUsed: boolean;
  status?: string;
  location: TruckDetailLocation;
  shipment: TruckDetailShipment;
  movementHistory: TruckMovementPoint[];
  source: TruckSearchItem;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface DemoLoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  issuedAt: string;
  user: TransporterUser;
}

export interface TransporterProfile {
  firstName: string;
  lastName: string;
  transporterNumber: string;
  agentAddress: string | null;
  agentPhone: string;
  transporterRole: string;
  agentProfilePictureBase64: string | null;
  appUserId: number;
  transporterRegions: string[];
}

export interface TransporterUser {
  userId: number;
  profileId: string;
  role: string;
  username: string;
  activeStatus: boolean;
  profile: TransporterProfile;
  permissions: string[];
}

export interface TransporterForgetPasswordRequest {
  email: string;
  transportNumber: string;
}

// Visibility
export interface VisibilityFilterDto {
  region?: string[];
  truckStatus?: string[];
  isMdd?: boolean;
  isBulk?: boolean;
  truckType?: string[];
  shipToStates?: string[];
  transactionType?: string[];
  transporterSapId?: string[];
  locationCategory?: string[];
  isAboveSevenDays?: boolean;
  daysSinceLastDispatch?: string;
  daysSinceLastDispatchAfter?: string;
  geofenceId?: number;
  shipmentCategory?: 'REROUTED' | 'DIVERTED';
  staffProfileId?: number;
  delegationType?: 'PRIMARY' | 'SECONDARY' | 'COMBINED';
  productName?: string;
}

// Escalated Tasks
export interface EscalatedTaskFilterDto {
  createdDateStart: string;
  createdDateEnd: string;
  resolvedDateStart?: string;
  resolvedDateEnd?: string;
  isResolved?: boolean;
  isPriority?: boolean;
  assignedDateStart?: string;
  assignedDateEnd?: string;
  escalationTypes?: string[];
  assignedToStaffIds?: number[];
  logons?: string[];
  truckPlates?: string[];
  transporterSapIds?: string[];
  regions?: string[];
}

// Diversions
export interface OrderDiversionFilterDto {
  createdDateStart?: string;
  createdDateEnd?: string;
  assignedTo?: number[];
  status?: string[];
  region?: string[];
  requestedBy?: number[];
  transporters?: string[];
  isKeyAccount?: boolean;
  ids?: number[];
}

// Reroutings
export interface OrderReroutingFilterDto {
  createdDateStart?: string;
  createdDateEnd?: string;
  assignedTo?: number[];
  status?: string[];
  urgencyLevel?: string[];
  requestedBy?: number[];
  ids?: number[];
  transporters?: string[];
  destinationDepotIds?: number[];
  destinationType?: 'CUSTOMER' | 'DEPOT';
  region?: string;
}

// Fleet / Assets
export interface AssetFilterDto {
  transporterNumber?: string;
  unmappedAssets?: boolean;
  registrationNumbers?: string[];
  transporterNumbers?: string[];
  truckStatuses?: string[];
  truckTypes?: string[];
  backhaulStatuses?: string[];
  geofenceId?: number;
  regions?: string[];
}

// KPI
export interface RankingComparisonRequest {
  transporterNumbers: string[];
  startDate: string;
  endDate: string;
  region?: 'NORTH' | 'WEST' | 'EAST' | 'ALL' | 'LAGOS';
  kpiTypes?: string[];
}

// Complaints
export interface ComplaintRequestDto {
  referenceId: string;
  complaintType: 'PER_SHIPMENT' | 'PER_ESCALATION' | 'GENERAL';
  title: string;
  description: string;
  priorityLevel?: number;
  category?: string;
  truckPlate?: string;
  driverName?: string;
  transporterName?: string;
}

// Backhaul
export interface BackHaulAssignmentFilterDto {
  createdDateStart?: string;
  createdDateEnd?: string;
  tripType?: 'BACKHAUL' | 'DEDICATED';
  assignmentStatus?: string[];
  transporterNumbers?: string[];
  truckPlates?: string[];
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

// Enums
export type Region = 'NORTH' | 'WEST' | 'EAST' | 'ALL' | 'LAGOS';
export type TruckType =
  | 'READY_MIX'
  | 'COAL'
  | 'AFR'
  | 'SILO275'
  | 'SINO275'
  | 'LAFARGE_OWNED'
  | 'SPECIAL_DEPLOYMENT';
export type TransactionType =
  | 'PLANT_TO_CUSTOMER'
  | 'PLANT_TO_DEPOT'
  | 'DEPOT_TO_CUSTOMER'
  | 'PLANT_TO_CUSTOMER_AND_PLANT_TO_DEPOT'
  | 'PLANT_TO_CUSTOMER_AND_DEPOT_TO_CUSTOMER'
  | 'ALL'
  | 'PLANT_TO_DEPOT_AND_DEPOT_TO_CUSTOMER';
export type KpiType =
  | 'DISPATCH_VOLUME'
  | 'GIGO'
  | 'CICO_CUSTOMER'
  | 'BACKHAUL'
  | 'LEAD_TIME'
  | 'OTD_RING_1'
  | 'AVG_DISTANCE_PER_TRIP'
  | 'TRIPS_PER_TRUCK_PER_WEEK'
  | 'TI'
  | 'TO'
  | 'AVERAGE_SCORE_CARD'
  | 'AVAILABILITY'
  | 'TOTAL_TRUCKS'
  | 'VIOLATION_RATE'
  | 'SKMD'
  | 'HRD';

export interface KpiFilterDto {
  transporterNumbers?: string[];
  regions?: Region[];
  startDate: string;
  endDate: string;
  customerCodes?: string[];
  productCodes?: string[];
  completedTripsOnly?: boolean;
  minVolume?: number;
  maxVolume?: number;
}

export interface KpiMetricDetail {
  actual: number | null;
  expected: number | null;
  variance: number | null;
  unitOfMeasurement?: string;
  kpiDescription?: string;
  formula?: string;
  rankings?: Record<string, string | number | null>;
}

export interface KpiV2AggregatedResult {
  kpiMetrics: Record<string, KpiMetricDetail>;
}

export interface KpiRankingEntry {
  kpiType: KpiType | string;
  metricValue: number | null;
  rank?: number | null;
  populationCount?: number | null;
}

export type KpiRankingsResult = {
  rankings: KpiRankingEntry[];
} | KpiRankingEntry[];

export interface KpiHistoryPoint {
  calculationWindowStart?: string;
  calculationWindowEnd?: string;
  period?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  windowStart?: string;
  metricValue?: number | null;
  actual?: number | null;
  value?: number | null;
  score?: number | null;
}

export type KpiHistoryResult = {
  history: KpiHistoryPoint[];
} | KpiHistoryPoint[];

export interface KpiLeaderboardEntry {
  rank?: number | null;
  transporterNumber?: string;
  transporterName?: string;
  metricValue?: number | null;
}

export type KpiLeaderboardResult = {
  leaderboard: KpiLeaderboardEntry[];
} | KpiLeaderboardEntry[];

export interface KpiAiAnalysisMetric {
  name: string;
  description: string;
  actual: number;
  expected: number;
  variance: number;
  unit: string;
}

export interface KpiAiAnalysisRequest {
  transporterNumber: string;
  startDate: string;
  endDate: string;
  metrics: KpiAiAnalysisMetric[];
}

export interface KpiAiAnalysisResult {
  summary?: string;
  insights?: string[];
  recommendations?: string[];
}

export interface KpiContributorMetric {
  key: string;
  label: string;
  actual: number | null;
  expected: number | null;
  variance: number | null;
  unit?: string;
  description?: string;
}

export type KpiInsightSeverity = 'healthy' | 'warning' | 'critical' | 'unknown';
export type KpiTrendSignal = 'improving' | 'declining' | 'stable' | 'insufficient_data';

export interface KpiRecommendedAction {
  id: string;
  title: string;
  description: string;
}

export interface KpiDeterministicInsight {
  severity: KpiInsightSeverity;
  trendSignal: KpiTrendSignal;
  headline: string;
  summary: string;
  gapToTarget: number | null;
  gapRatio: number | null;
  trendDeltaPercent: number | null;
  topContributors: KpiContributorMetric[];
  actions: KpiRecommendedAction[];
}

export type KpiContributorMapping = Record<KpiType, string[]>;
