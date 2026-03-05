import type {
  ShipmentFeedbackContribution,
  ShipmentFeedbackListResult,
  ShipmentFeedbackRecord,
} from '@/types/api';

type UnknownRecord = Record<string, unknown>;

const toRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;

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

const unwrapResponse = (payload: unknown): unknown => {
  const root = toRecord(payload);
  if (!root) return payload;
  if (root.result !== undefined && root.result !== null) return root.result;
  if (root.data !== undefined && root.data !== null) return root.data;
  return payload;
};

const mapContribution = (entry: unknown): ShipmentFeedbackContribution | null => {
  const source = toRecord(entry);
  if (!source) return null;

  return {
    actorType: pickString(source, ['actorType', 'contributorRole', 'role']),
    actorId: pickString(source, ['actorId', 'contributorId', 'userId']),
    actorName: pickString(source, ['actorName', 'contributorName', 'username']),
    action: pickString(source, ['action', 'eventType']),
    createdAt: pickString(source, ['createdAt', 'timestamp', 'updatedAt']),
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

  return {
    id: pickNumber(source, ['id', 'feedbackId']),
    logon: pickString(source, ['logon', 'logonNumber']),
    shipmentNumber: pickString(source, ['shipmentNumber', 'orderNumber']),
    transporterNumber: pickString(source, ['transporterNumber', 'transporterSapId']),
    region: pickString(source, ['region']),
    feedbackDate: pickString(source, ['feedbackDate', 'createdDate']),
    driverSapId: pickNumber(source, ['driverSapId', 'driverId']),
    driverName: pickString(source, ['driverName']),
    truckPlate: pickString(source, ['truckPlate', 'registrationNumber']),
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
    hosHoursManual: pickNumber(source, ['hosHoursManual']),
    violationsTotalManual: pickNumber(source, ['violationsTotalManual']),
    violationsOsManual: pickNumber(source, ['violationsOsManual']),
    violationsHbManual: pickNumber(source, ['violationsHbManual']),
    violationsHaManual: pickNumber(source, ['violationsHaManual']),
    violationsCdManual: pickNumber(source, ['violationsCdManual']),
    manualOverrideReason: pickString(source, ['manualOverrideReason']),
    createdAt: pickString(source, ['createdAt']),
    updatedAt: pickString(source, ['updatedAt']),
    contributions,
  };
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
