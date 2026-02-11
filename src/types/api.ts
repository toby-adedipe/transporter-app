// Standard API response wrapper
export interface AppResponse<T> {
  message: string;
  statusCode?: string;
  isSuccessful: boolean;
  time: string;
  result: T;
}

// Auth
export interface LoginRequest {
  email: string;
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
