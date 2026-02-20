import type {
  TruckDetailShipment,
  TruckDetailViewModel,
  TruckMovementPoint,
  TruckSearchItem,
} from '@/types/api';

type UnknownRecord = Record<string, unknown>;

const LIST_KEYS = ['data', 'result', 'results', 'content', 'items'] as const;
const PLATE_KEYS = [
  'truckPlate',
  'truck_plate',
  'plate',
  'registrationNumber',
  'registration_number',
] as const;

const LOCATION_LAT_KEYS = [
  'latitude',
  'lat',
  'location.latitude',
  'location.lat',
  'currentLocation.latitude',
  'currentLocation.lat',
  'lastLocation.latitude',
  'lastLocation.lat',
] as const;

const LOCATION_LNG_KEYS = [
  'longitude',
  'lng',
  'lon',
  'location.longitude',
  'location.lng',
  'location.lon',
  'currentLocation.longitude',
  'currentLocation.lng',
  'currentLocation.lon',
  'lastLocation.longitude',
  'lastLocation.lng',
  'lastLocation.lon',
] as const;

const LOCATION_ADDRESS_KEYS = [
  'address',
  'locationAddress',
  'location.address',
  'currentLocation.address',
  'lastLocation.address',
  'city',
  'state',
] as const;

const LOCATION_UPDATED_AT_KEYS = [
  'updatedAt',
  'locationUpdatedAt',
  'timestamp',
  'lastUpdated',
  'location.timestamp',
  'currentLocation.timestamp',
  'lastLocation.timestamp',
] as const;

const TRUCK_STATUS_KEYS = ['status', 'truckStatus', 'movementStatus', 'state'] as const;
const SHIPMENT_KEYS = ['currentShipment', 'shipment', 'activeShipment', 'shipmentInfo'] as const;
const HISTORY_KEYS = [
  'movementHistory',
  'history',
  'locationHistory',
  'routeHistory',
  'movements',
  'movement_history',
] as const;

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;

const getByPath = (record: UnknownRecord, path: string): unknown => {
  if (!path.includes('.')) return record[path];

  return path.split('.').reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== 'object' || Array.isArray(acc)) return undefined;
    return (acc as UnknownRecord)[segment];
  }, record);
};

const pickFirst = (record: UnknownRecord, paths: readonly string[]): unknown => {
  for (const path of paths) {
    const value = getByPath(record, path);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizePlate = (value: string): string => value.trim().toLowerCase();

const resolvePlate = (item: UnknownRecord): string | undefined =>
  toStringValue(pickFirst(item, PLATE_KEYS));

const findFirstArray = (node: unknown, depth = 0): unknown[] | null => {
  if (Array.isArray(node)) return node;
  if (depth > 4) return null;

  const record = asRecord(node);
  if (!record) return null;

  for (const key of LIST_KEYS) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
  }

  for (const key of LIST_KEYS) {
    const nested = findFirstArray(record[key], depth + 1);
    if (nested) return nested;
  }

  return null;
};

const resolveTruckSearchItems = (payload: unknown): TruckSearchItem[] => {
  const firstArray = findFirstArray(payload);
  if (!firstArray) return [];

  return firstArray
    .map((entry) => asRecord(entry))
    .filter((entry): entry is TruckSearchItem => Boolean(entry));
};

const parseShipmentDetails = (item: UnknownRecord): TruckDetailShipment => {
  const shipmentRecord = asRecord(pickFirst(item, SHIPMENT_KEYS));
  const source = shipmentRecord ?? item;

  return {
    reference: toStringValue(
      pickFirst(source, [
        'reference',
        'referenceId',
        'logon',
        'shipmentNumber',
        'shipmentNo',
        'orderNumber',
        'orderNo',
        'waybillNumber',
      ]),
    ),
    status: toStringValue(pickFirst(source, ['status', 'shipmentStatus', 'state'])),
    origin: toStringValue(
      pickFirst(source, ['origin', 'originDepot', 'from', 'source', 'plant']),
    ),
    destination: toStringValue(
      pickFirst(source, ['destination', 'destinationDepot', 'to', 'customerName', 'destinationName']),
    ),
    eta: toStringValue(
      pickFirst(source, ['eta', 'estimatedArrival', 'estimatedTimeOfArrival', 'expectedArrivalTime']),
    ),
    customer: toStringValue(pickFirst(source, ['customer', 'customerName'])),
    product: toStringValue(pickFirst(source, ['product', 'productName'])),
  };
};

const parseHistory = (item: UnknownRecord): TruckMovementPoint[] => {
  const historyValue = pickFirst(item, HISTORY_KEYS);
  const historyArray = findFirstArray(historyValue);
  if (!historyArray) return [];

  const points = historyArray
    .map((entry) => asRecord(entry))
    .filter((entry): entry is UnknownRecord => Boolean(entry))
    .map((entry) => ({
      timestamp: toStringValue(
        pickFirst(entry, ['timestamp', 'time', 'recordedAt', 'updatedAt', 'eventTime', 'dateTime']),
      ),
      latitude: toNumberValue(pickFirst(entry, ['latitude', 'lat'])),
      longitude: toNumberValue(pickFirst(entry, ['longitude', 'lng', 'lon'])),
      address: toStringValue(pickFirst(entry, ['address', 'location', 'locationName'])),
      status: toStringValue(pickFirst(entry, ['status', 'movementStatus', 'event'])),
      speed: toNumberValue(pickFirst(entry, ['speed', 'speedKph', 'velocity'])),
    }))
    .filter(
      (point) =>
        point.timestamp !== undefined ||
        point.latitude !== undefined ||
        point.longitude !== undefined ||
        point.address !== undefined ||
        point.status !== undefined,
    )
    .sort((a, b) => {
      const aTime = a.timestamp ? Date.parse(a.timestamp) : Number.NEGATIVE_INFINITY;
      const bTime = b.timestamp ? Date.parse(b.timestamp) : Number.NEGATIVE_INFINITY;
      return bTime - aTime;
    });

  return points.slice(0, 10);
};

export const mapTruckDetailFromSearch = (
  payload: unknown,
  requestedPlate: string,
): TruckDetailViewModel | null => {
  const trimmedRequestedPlate = requestedPlate.trim();
  if (!trimmedRequestedPlate) return null;

  const items = resolveTruckSearchItems(payload);
  if (items.length === 0) return null;

  const requestedPlateKey = normalizePlate(trimmedRequestedPlate);
  const exactMatch = items.find((item) => {
    const plate = resolvePlate(item);
    return plate ? normalizePlate(plate) === requestedPlateKey : false;
  });

  const selectedItem = (exactMatch ?? items[0]) as UnknownRecord;
  const selectedPlate = resolvePlate(selectedItem) ?? trimmedRequestedPlate;

  return {
    plate: selectedPlate,
    requestedPlate: trimmedRequestedPlate,
    exactPlateMatch: Boolean(exactMatch),
    fallbackUsed: !exactMatch,
    status: toStringValue(pickFirst(selectedItem, TRUCK_STATUS_KEYS)),
    location: {
      latitude: toNumberValue(pickFirst(selectedItem, LOCATION_LAT_KEYS)),
      longitude: toNumberValue(pickFirst(selectedItem, LOCATION_LNG_KEYS)),
      address: toStringValue(pickFirst(selectedItem, LOCATION_ADDRESS_KEYS)),
      updatedAt: toStringValue(pickFirst(selectedItem, LOCATION_UPDATED_AT_KEYS)),
      status: toStringValue(pickFirst(selectedItem, TRUCK_STATUS_KEYS)),
    },
    shipment: parseShipmentDetails(selectedItem),
    movementHistory: parseHistory(selectedItem),
    source: selectedItem,
  };
};

