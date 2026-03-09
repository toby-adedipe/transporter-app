import type {
  DriverHosRecord,
  ShipmentFeedbackContribution,
  ShipmentFeedbackEligibilityResult,
  ShipmentFeedbackListResult,
  ShipmentFeedbackRecord,
  ShipmentFeedbackShipmentContext,
} from '@/types/api';

type UnknownRecord = Record<string, unknown>;
const FEEDBACK_CONTEXT_CONTAINER_KEYS = [
  'shipment',
  'currentShipment',
  'activeShipment',
  'shipmentInfo',
  'details',
  'order',
  'orderDetails',
  'trip',
  'tripDetails',
  'data',
  'result',
] as const;

const toRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;

const getPathValue = (source: unknown, path: string): unknown => {
  const segments = path.split('.');
  let current: unknown = source;

  for (const segment of segments) {
    const record = toRecord(current);
    if (!record) return undefined;
    current = record[segment];
    if (current === undefined || current === null) return current;
  }

  return current;
};

const pickValue = (source: UnknownRecord, keys: string[]): unknown => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const pickString = (source: UnknownRecord, keys: string[]): string | undefined => {
  const value = pickValue(source, keys);
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
};

const pickNumber = (source: UnknownRecord, keys: string[]): number | undefined => {
  const value = pickValue(source, keys);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const pickBoolean = (source: UnknownRecord, keys: string[]): boolean | undefined => {
  const value = pickValue(source, keys);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

const pickArray = (source: UnknownRecord, keys: string[]): unknown[] => {
  const value = pickValue(source, keys);
  return Array.isArray(value) ? value : [];
};

const pickNestedValue = (source: unknown, keys: string[]): unknown => {
  for (const key of keys) {
    const value = getPathValue(source, key);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const pickNestedString = (source: unknown, keys: string[]): string | undefined => {
  const value = pickNestedValue(source, keys);
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
};

const pickNestedNumber = (source: unknown, keys: string[]): number | undefined => {
  const value = pickNestedValue(source, keys);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const flattenContextSources = (source: unknown, depth = 0): UnknownRecord[] => {
  if (depth > 3) return [];

  const record = toRecord(source);
  if (!record) return [];

  const nested = FEEDBACK_CONTEXT_CONTAINER_KEYS.flatMap((key) =>
    flattenContextSources(record[key], depth + 1),
  );

  return [record, ...nested];
};

const unwrapResponse = (payload: unknown): unknown => {
  const root = toRecord(payload);
  if (!root) return payload;
  if (root.result !== undefined && root.result !== null) return root.result;
  if (root.data !== undefined && root.data !== null) return root.data;
  return payload;
};

const mapShipmentContextSource = (source: unknown): ShipmentFeedbackShipmentContext | null => {
  const records = flattenContextSources(source);
  if (records.length === 0) return null;

  const pickFromRecordsString = (keys: string[]): string | undefined => {
    for (const record of records) {
      const value = pickString(record, keys);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const pickFromRecordsNumber = (keys: string[]): number | undefined => {
    for (const record of records) {
      const value = pickNumber(record, keys);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const shipmentNumber =
    pickFromRecordsString([
      'shipmentNumber',
      'orderNumber',
      'shipmentNo',
      'orderNo',
      'reference',
      'referenceId',
      'waybillNumber',
    ]) ??
    pickNestedString(source, [
      'shipment.shipmentNumber',
      'shipment.orderNumber',
      'shipment.reference',
      'currentShipment.shipmentNumber',
      'shipmentInfo.shipmentNumber',
      'order.shipmentNumber',
      'orderDetails.shipmentNumber',
    ]);
  const logon =
    pickFromRecordsString(['logon', 'logonNumber', 'logonNo']) ??
    pickNestedString(source, [
      'shipment.logon',
      'shipment.logonNumber',
      'currentShipment.logon',
      'shipmentInfo.logon',
      'order.logon',
    ]);
  const shipmentStatus =
    pickFromRecordsString(['shipmentStatus', 'status', 'state', 'deliveryStatus']) ??
    pickNestedString(source, [
      'shipment.shipmentStatus',
      'shipment.status',
      'shipment.state',
      'currentShipment.status',
      'shipmentInfo.status',
      'order.status',
    ]);
  const orderStatus =
    pickFromRecordsString(['orderStatus']) ??
    pickNestedString(source, [
      'shipment.orderStatus',
      'shipmentInfo.orderStatus',
      'order.orderStatus',
      'computedContext.orderStatus',
    ]);
  const origin =
    pickFromRecordsString([
      'origin',
      'originDepot',
      'from',
      'source',
      'plant',
      'plantName',
      'loadingPoint',
    ]) ??
    pickNestedString(source, [
      'shipment.origin',
      'shipment.originDepot',
      'shipment.plant',
      'route.origin',
      'trip.origin',
      'shipmentInfo.origin',
      'order.origin',
    ]);
  const destination =
    pickFromRecordsString([
      'destination',
      'destinationDepot',
      'destinationName',
      'to',
      'customerName',
      'customer',
      'offloadPoint',
    ]) ??
    pickNestedString(source, [
      'shipment.destination',
      'shipment.destinationDepot',
      'shipment.destinationName',
      'route.destination',
      'trip.destination',
      'shipmentInfo.destination',
      'order.destination',
    ]);
  const customerName =
    pickFromRecordsString(['customerName', 'customer', 'customerFullName', 'consigneeName']) ??
    pickNestedString(source, [
      'shipment.customerName',
      'shipment.customer',
      'customer.name',
      'consignee.name',
      'shipmentInfo.customerName',
      'order.customerName',
    ]);
  const dispatchDate =
    pickFromRecordsString([
      'dispatchDate',
      'dispatchedAt',
      'dispatchTime',
      'loadedAt',
      'loadingCompletedAt',
      'tripStartTime',
    ]) ??
    pickNestedString(source, [
      'shipment.dispatchDate',
      'shipment.dispatchedAt',
      'shipment.dispatchTime',
      'timeline.dispatchDate',
      'trip.dispatchDate',
      'shipmentInfo.dispatchDate',
      'order.dispatchDate',
    ]);
  const truckPlate =
    pickFromRecordsString([
      'truckPlate',
      'registrationNumber',
      'truckNumber',
      'plate',
      'registrationNo',
    ]) ??
    pickNestedString(source, [
      'truck.truckPlate',
      'truck.registrationNumber',
      'vehicle.truckPlate',
      'vehicle.registrationNumber',
      'driver.truckPlate',
      'shipment.truckPlate',
      'shipmentInfo.truckPlate',
    ]);
  const driverName =
    pickFromRecordsString(['driverName', 'name', 'fullName']) ??
    pickNestedString(source, [
      'driver.driverName',
      'driver.name',
      'shipment.driverName',
      'assignedDriver.name',
      'shipmentInfo.driverName',
    ]);
  const driverSapId =
    pickFromRecordsNumber(['driverSapId', 'driverId', 'sapDriverId', 'driverSapCode']) ??
    pickNestedNumber(source, [
      'driver.driverSapId',
      'driver.driverId',
      'shipment.driverSapId',
      'assignedDriver.driverSapId',
      'shipmentInfo.driverSapId',
    ]);

  const context: ShipmentFeedbackShipmentContext = {
    logon,
    shipmentNumber,
    shipmentStatus,
    origin,
    destination,
    customerName,
    customerLocation:
      pickFromRecordsString(['customerLocation', 'location']) ??
      pickNestedString(source, [
        'shipment.customerLocation',
        'shipmentInfo.customerLocation',
        'customer.location',
      ]),
    quantity:
      pickFromRecordsNumber(['quantity', 'productTonnage']) ??
      pickNestedNumber(source, [
        'shipment.quantity',
        'shipmentInfo.quantity',
        'order.quantity',
      ]),
    dispatchDate,
    truckPlate,
    driverName,
    driverSapId,
    orderStatus,
  };

  return Object.values(context).some((value) => value !== undefined && value !== null) ? context : null;
};

export const mergeShipmentFeedbackContext = (
  ...contexts: Array<ShipmentFeedbackShipmentContext | null | undefined>
): ShipmentFeedbackShipmentContext | null => {
  const merged = contexts.reduce<ShipmentFeedbackShipmentContext>((result, context) => {
    if (!context) return result;

    return {
      logon: result.logon ?? context.logon,
      shipmentNumber: result.shipmentNumber ?? context.shipmentNumber,
      orderStatus: result.orderStatus ?? context.orderStatus,
      shipmentStatus: result.shipmentStatus ?? context.shipmentStatus,
      origin: result.origin ?? context.origin,
      destination: result.destination ?? context.destination,
      customerName: result.customerName ?? context.customerName,
      customerLocation: result.customerLocation ?? context.customerLocation,
      quantity: result.quantity ?? context.quantity,
      dispatchDate: result.dispatchDate ?? context.dispatchDate,
      truckPlate: result.truckPlate ?? context.truckPlate,
      driverName: result.driverName ?? context.driverName,
      driverSapId: result.driverSapId ?? context.driverSapId,
    };
  }, {});

  return Object.values(merged).some((value) => value !== undefined && value !== null) ? merged : null;
};

export const hasCompleteShipmentFeedbackContext = (
  context?: ShipmentFeedbackShipmentContext | null,
): boolean =>
  Boolean(
    (context?.orderStatus || context?.shipmentStatus) &&
      context.origin &&
      (context.destination || context.customerName) &&
      context.truckPlate &&
      context.driverName,
  );

const mapContribution = (entry: unknown): ShipmentFeedbackContribution | null => {
  const source = toRecord(entry);
  if (!source) return null;

  return {
    id: pickNumber(source, ['id']),
    actorType: pickString(source, ['actorType', 'contributorRole', 'role']),
    actorId: pickString(source, ['actorId', 'contributorId', 'userId']),
    actorName: pickString(source, [
      'actorName',
      'contributorName',
      'username',
      'userName',
      'name',
    ]),
    userId: pickNumber(source, ['userId']),
    userName: pickString(source, ['userName', 'username', 'actorName']),
    action: pickString(source, ['action', 'eventType']),
    createdAt: pickString(source, ['createdAt', 'timestamp', 'updatedAt']),
    remarks: pickString(source, ['remarks', 'comment', 'note', 'description']),
    changes: toRecord(pickValue(source, ['changes', 'delta', 'fieldChanges'])) ?? undefined,
  };
};

export const mapShipmentFeedback = (payload: unknown): ShipmentFeedbackRecord | null => {
  const unwrapped = unwrapResponse(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped.length > 0 ? mapShipmentFeedback(unwrapped[0]) : null;
  }

  const root = toRecord(unwrapped);
  if (!root) return null;

  const nestedFeedback = toRecord(
    pickValue(root, ['feedback', 'shipmentFeedback', 'record', 'details']),
  );
  const source = nestedFeedback ?? root;

  const contributions = pickArray(source, [
    'contributions',
    'contributionHistory',
    'history',
    'auditTrail',
  ])
    .map(mapContribution)
    .filter((item): item is ShipmentFeedbackContribution => Boolean(item));

  const feedbackExists =
    pickBoolean(source, ['feedbackExists']) ?? pickBoolean(root, ['feedbackExists']);
  const context = mergeShipmentFeedbackContext(
    mapShipmentContextSource(source),
    mapShipmentContextSource(nestedFeedback),
    mapShipmentContextSource(root),
  );

  return {
    id: pickNumber(source, ['id', 'feedbackId']),
    feedbackExists,
    logon: context?.logon,
    shipmentNumber: context?.shipmentNumber,
    orderStatus: context?.orderStatus,
    shipmentStatus: context?.shipmentStatus,
    origin: context?.origin,
    destination: context?.destination,
    customerName: context?.customerName,
    customerLocation: context?.customerLocation,
    quantity: context?.quantity,
    dispatchDate: context?.dispatchDate,
    transporterNumber: pickString(source, ['transporterNumber', 'transporterSapId']),
    transporterName: pickString(source, ['transporterName']),
    region: pickString(source, ['region']),
    requiresDriverAcknowledgment: pickBoolean(source, ['requiresDriverAcknowledgment']),
    driverAcknowledgedAt: pickString(source, ['driverAcknowledgedAt']),
    driverAcknowledgedByUserId: pickNumber(source, ['driverAcknowledgedByUserId']),
    driverAcknowledgedByName: pickString(source, ['driverAcknowledgedByName']),
    feedbackDate: pickString(source, ['feedbackDate', 'createdDate']),
    driverSapId: context?.driverSapId,
    driverName: context?.driverName,
    truckPlate: context?.truckPlate,
    driverFeedbackText: pickString(source, ['driverFeedbackText']),
    otherInformationText: pickString(source, ['otherInformationText']),
    delayAtCustomer: pickBoolean(source, ['delayAtCustomer']),
    tamperingObserved: pickBoolean(source, ['tamperingObserved']),
    distanceCovered: pickNumber(source, ['distanceCovered']),
    unknownDistanceCovered: pickNumber(source, ['unknownDistanceCovered']),
    driverScoreOnArrival: pickNumber(source, ['driverScoreOnArrival']),
    driverArrivalRating: pickString(source, ['driverArrivalRating']),
    driverBehaviour: pickString(source, ['driverBehaviour']),
    remedialAction: pickString(source, ['remedialAction']),
    otherRemarks: pickString(source, ['otherRemarks']),
    consequenceDue: pickBoolean(source, ['consequenceDue']),
    consequenceApplied: pickString(source, ['consequenceApplied']),
    hosHoursGenerated: pickNumber(source, ['hosHoursGenerated']),
    violationsTotalGenerated: pickNumber(source, ['violationsTotalGenerated']),
    violationsOsGenerated: pickNumber(source, ['violationsOsGenerated']),
    violationsHbGenerated: pickNumber(source, ['violationsHbGenerated']),
    violationsHaGenerated: pickNumber(source, ['violationsHaGenerated']),
    violationsCdGenerated: pickNumber(source, ['violationsCdGenerated']),
    autoMetricsGeneratedAt: pickString(source, ['autoMetricsGeneratedAt']),
    hosHoursManual: pickNumber(source, ['hosHoursManual']),
    violationsTotalManual: pickNumber(source, ['violationsTotalManual']),
    violationsOsManual: pickNumber(source, ['violationsOsManual']),
    violationsHbManual: pickNumber(source, ['violationsHbManual']),
    violationsHaManual: pickNumber(source, ['violationsHaManual']),
    violationsCdManual: pickNumber(source, ['violationsCdManual']),
    effectiveHosHours: pickNumber(source, ['effectiveHosHours']),
    effectiveViolationsTotal: pickNumber(source, ['effectiveViolationsTotal']),
    effectiveViolationsOs: pickNumber(source, ['effectiveViolationsOs']),
    effectiveViolationsHb: pickNumber(source, ['effectiveViolationsHb']),
    effectiveViolationsHa: pickNumber(source, ['effectiveViolationsHa']),
    effectiveViolationsCd: pickNumber(source, ['effectiveViolationsCd']),
    manualOverrideReason: pickString(source, ['manualOverrideReason']),
    createdByUserId: pickNumber(source, ['createdByUserId']),
    createdByName: pickString(source, ['createdByName']),
    updatedByUserId: pickNumber(source, ['updatedByUserId']),
    updatedByName: pickString(source, ['updatedByName']),
    createdDate: pickString(source, ['createdDate', 'createdAt']),
    updatedDate: pickString(source, ['updatedDate', 'updatedAt']),
    createdAt: pickString(source, ['createdAt', 'createdDate']),
    updatedAt: pickString(source, ['updatedAt', 'updatedDate']),
    contributions,
  };
};

export const getShipmentFeedbackExists = (payload: unknown): boolean | undefined => {
  const record = mapShipmentFeedback(payload);
  return record?.feedbackExists;
};

export const mapShipmentFeedbackContext = (
  payload: unknown,
): ShipmentFeedbackShipmentContext | null => {
  const unwrapped = unwrapResponse(payload);
  const root = toRecord(unwrapped);

  if (!root) return null;

  const collection = pickValue(root, ['content', 'items', 'data', 'records', 'results', 'shipments']);
  const candidates = Array.isArray(collection)
    ? collection
    : Array.isArray(unwrapped)
      ? unwrapped
      : [unwrapped];

  for (const entry of candidates) {
    const context = mapShipmentContextSource(entry);
    if (context) return context;
  }

  return mapShipmentContextSource(root);
};

export const mapShipmentFeedbackList = (payload: unknown): ShipmentFeedbackListResult => {
  const unwrapped = unwrapResponse(payload);
  const root = toRecord(unwrapped);

  const listCandidate = root
    ? pickValue(root, ['content', 'items', 'data', 'records', 'results'])
    : unwrapped;

  const rawItems = Array.isArray(listCandidate)
    ? listCandidate
    : Array.isArray(unwrapped)
      ? unwrapped
      : [];

  const items = rawItems
    .map((entry) => mapShipmentFeedback(entry))
    .filter((entry): entry is ShipmentFeedbackRecord => Boolean(entry));

  const page = root
    ? pickNumber(root, ['page', 'number', 'pageNumber']) ?? 0
    : 0;
  const size = root
    ? pickNumber(root, ['size', 'pageSize']) ?? rawItems.length
    : rawItems.length;
  const totalElements = root
    ? pickNumber(root, ['totalElements', 'totalItems', 'totalCount']) ?? items.length
    : items.length;
  const totalPages = root
    ? pickNumber(root, ['totalPages', 'pageCount']) ?? (size > 0 ? Math.ceil(totalElements / size) : 1)
    : 1;

  return {
    items,
    page,
    size,
    totalElements,
    totalPages,
    raw: unwrapped,
  };
};

export const mapShipmentFeedbackEligibility = (
  payload: unknown,
): ShipmentFeedbackEligibilityResult => {
  const unwrapped = unwrapResponse(payload);
  const root = toRecord(unwrapped);
  const source = root ?? {};

  const topLevelReason = pickString(source, [
    'reason',
    'failureReason',
    'message',
    'summary',
    'status',
  ]);

  const rules = pickArray(source, ['failedRules', 'rules', 'checks', 'results']);
  const nestedReasons = rules.flatMap((entry) => {
    const item = toRecord(entry);
    if (!item) return [];

    const passed = pickBoolean(item, ['passed', 'eligible', 'isEligible']);
    if (passed === true) return [];

    const reason = pickString(item, ['reason', 'message', 'name', 'label', 'title']);
    return reason ? [reason] : [];
  });

  const directReasons = pickArray(source, ['reasons', 'errors', 'messages']).flatMap((entry) => {
    if (typeof entry === 'string' && entry.trim().length > 0) return [entry.trim()];
    const item = toRecord(entry);
    if (!item) return [];
    const reason = pickString(item, ['reason', 'message', 'name', 'label']);
    return reason ? [reason] : [];
  });

  const reasons = Array.from(
    new Set(
      [...directReasons, ...nestedReasons, ...(topLevelReason ? [topLevelReason] : [])].filter(
        (value) => value.trim().length > 0,
      ),
    ),
  );

  const explicitEligibility = pickBoolean(source, [
    'eligible',
    'isEligible',
    'canCreate',
    'allowed',
    'passed',
  ]);
  const computedContextSource = toRecord(pickValue(source, ['computedContext']));
  const computedContext = computedContextSource
    ? {
        shipmentNumber: pickString(computedContextSource, ['shipmentNumber', 'orderNumber']),
        logon: pickString(computedContextSource, ['logon', 'logonNumber']),
        orderStatus: pickString(computedContextSource, ['orderStatus']),
        truckPlate: pickString(computedContextSource, ['truckPlate', 'registrationNumber']),
        driverName: pickString(computedContextSource, ['driverName']),
        driverSapId: pickNumber(computedContextSource, ['driverSapId', 'driverId']),
        transporterNumber: pickString(computedContextSource, ['transporterNumber', 'transporterSapId']),
        transporterName: pickString(computedContextSource, ['transporterName']),
        driverBlocked: pickBoolean(computedContextSource, ['driverBlocked']),
        driverRedRisk: pickBoolean(computedContextSource, ['driverRedRisk']),
        truckTracking: pickBoolean(computedContextSource, ['truckTracking']),
        offloadedDateTimeAvailable: pickBoolean(computedContextSource, ['offloadedDateTimeAvailable']),
        resolvedOffloadedDateTime: pickString(computedContextSource, ['resolvedOffloadedDateTime']),
      }
    : undefined;

  return {
    eligible: explicitEligibility ?? reasons.length === 0,
    reasons,
    summary: topLevelReason,
    computedContext,
    raw: unwrapped,
  };
};

export const mapShipmentNumberByLogon = (payload: unknown): string | undefined => {
  const unwrapped = unwrapResponse(payload);
  const root = toRecord(unwrapped);

  const collection = root
    ? pickValue(root, ['content', 'items', 'data', 'records', 'results', 'shipments'])
    : unwrapped;

  const candidates = Array.isArray(collection)
    ? collection
    : Array.isArray(unwrapped)
      ? unwrapped
      : [unwrapped];

  for (const entry of candidates) {
    const record = toRecord(entry);
    if (!record) continue;

    const shipmentNumber = pickString(record, ['shipmentNumber', 'orderNumber', 'shipmentNo']);
    if (shipmentNumber) return shipmentNumber;
  }

  return undefined;
};

export const mapDriverHos = (payload: unknown): DriverHosRecord | null => {
  const unwrapped = unwrapResponse(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped.length > 0 ? mapDriverHos(unwrapped[0]) : null;
  }

  const root = toRecord(unwrapped);
  if (!root) return null;

  const nested = toRecord(
    pickValue(root, ['hos', 'driverHos', 'metrics', 'summary', 'record', 'details']),
  );
  const source = nested ?? root;
  const driverId = pickNumber(source, ['driverId', 'id']);
  const driverSapId = pickNumber(source, ['driverSapId', 'sapDriverId', 'driverId', 'id']);
  const lastUpdated = pickString(source, [
    'lastUpdated',
    'updatedAt',
    'generatedAt',
    'capturedAt',
    'createdAt',
    'time',
    'date',
  ]);

  const record: DriverHosRecord = {
    driverId,
    driverSapId,
    currentStatusDescription: pickString(source, ['currentStatusDescription', 'statusDescription']),
    isOnDuty: pickBoolean(source, ['isOnDuty', 'onDuty']),
    dailyTimeBeforeRest: pickString(source, ['dailyTimeBeforeRest']),
    weeklyTimeBeforeRest: pickString(source, ['weeklyTimeBeforeRest']),
    dailyAvailableDrivingRolling: pickString(source, ['dailyAvailableDrivingRolling']),
    availableDrivingBeforeBreak: pickString(source, ['availableDrivingBeforeBreak']),
    dayDrivingUsed: pickString(source, ['dayDrivingUsed']),
    nightDrivingUsed: pickString(source, ['nightDrivingUsed']),
    expectedRestDuration: pickString(source, ['expectedRestDuration']),
    lastUpdated,
    raw: unwrapped,
  };

  const hasValue = Object.entries(record).some(
    ([key, value]) => key !== 'raw' && value !== undefined && value !== null,
  );

  if (!hasValue) return null;

  return record;
};
