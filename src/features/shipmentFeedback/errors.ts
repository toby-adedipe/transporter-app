import type { ShipmentFeedbackEligibilityResult } from '@/types/api';

type FeedbackErrorContext = 'load' | 'eligibility' | 'create';

const FEEDBACK_REASON_MESSAGES: Record<string, string> = {
  DRIVER_BLOCKED:
    'The driver is currently blocked. Only green or amber drivers can receive feedback.',
  DRIVER_RED:
    'The driver is currently red. Only green or amber drivers can receive feedback.',
  DRIVER_NOT_GREEN_OR_AMBER:
    'The driver must be green or amber before feedback can be submitted.',
  DRIVER_NOT_ELIGIBLE:
    'The driver is not eligible for feedback at the moment.',
  ORDER_NOT_FINISHED: 'The order is not in finished status yet.',
  ORDER_FINISHED_REQUIRED: 'The order must be in finished status before feedback can be submitted.',
  TRUCK_NOT_TRACKING: 'The truck is not currently tracking in IVMS.',
  IVMS_NOT_TRACKING: 'The truck is not currently tracking in IVMS.',
  TRACKING_REQUIRED: 'Truck tracking in IVMS is required before feedback can be submitted.',
  FEEDBACK_ALREADY_EXISTS: 'Feedback has already been submitted for this shipment.',
  SHIPMENT_FEEDBACK_ALREADY_EXISTS: 'Feedback has already been submitted for this shipment.',
  ALREADY_EXISTS: 'Feedback has already been submitted for this shipment.',
  SHIPMENT_NOT_FOUND: 'The shipment reference could not be found.',
  LOGON_NOT_FOUND: 'The shipment logon could not be found.',
  INVALID_LOGON: 'The shipment logon is invalid.',
  MISSING_SHIPMENT_NUMBER: 'The shipment number is required before feedback can be submitted.',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toSentenceCase = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const humanizeReasonCode = (code: string): string => {
  const trimmedCode = code.trim().replace(/[[\]]/g, '');
  if (!trimmedCode) return '';

  const mapped = FEEDBACK_REASON_MESSAGES[trimmedCode];
  if (mapped) return mapped;

  const humanized = trimmedCode
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return humanized ? `${humanized}.` : '';
};

const extractReasonCodes = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const bracketMatch = trimmed.match(/\[([A-Z0-9_,\s-]+)\]/);
  if (bracketMatch?.[1]) {
    return bracketMatch[1]
      .split(',')
      .map((entry) => entry.trim().replace(/-/g, '_'))
      .filter(Boolean);
  }

  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed)) {
    return [trimmed];
  }

  return [];
};

export const normalizeShipmentFeedbackReasons = (reasons: string[]): string[] => {
  const normalized = reasons.flatMap((reason) => {
    const trimmed = reason.trim();
    if (!trimmed) return [];

    const codes = extractReasonCodes(trimmed);
    if (codes.length > 0) {
      return codes.map(humanizeReasonCode).filter(Boolean);
    }

    const lowered = trimmed.toLowerCase();

    if (lowered.includes('shipmentfeedback with') && lowered.includes('was not found')) {
      return ['No feedback exists for this shipment yet.'];
    }

    if (lowered.includes('format specifier')) {
      return ['We could not complete the feedback eligibility check right now. Please try again.'];
    }

    if (lowered.includes('already exists')) {
      return ['Feedback has already been submitted for this shipment.'];
    }

    return [toSentenceCase(trimmed)];
  });

  return Array.from(new Set(normalized.filter(Boolean)));
};

const getStatusCode = (error: unknown): number | null => {
  if (!isRecord(error)) return null;

  const status = error.status;
  if (typeof status === 'number') return status;

  const originalStatus = error.originalStatus;
  if (typeof originalStatus === 'number') return originalStatus;

  return null;
};

const getRawErrorMessages = (error: unknown): string[] => {
  if (!isRecord(error)) return [];

  const data = isRecord(error.data) ? error.data : null;
  const result = data?.result;

  const candidates = [
    typeof data?.message === 'string' ? data.message : '',
    typeof data?.detail === 'string' ? data.detail : '',
    typeof result === 'string' ? result : '',
    typeof error.error === 'string' ? error.error : '',
  ].map((entry) => entry.trim());

  return Array.from(new Set(candidates.filter(Boolean)));
};

export const getShipmentFeedbackEligibilityMessage = (
  eligibility: ShipmentFeedbackEligibilityResult,
): string => {
  const reasons = normalizeShipmentFeedbackReasons([
    ...eligibility.reasons,
    ...(eligibility.summary ? [eligibility.summary] : []),
  ]);

  if (reasons.length === 0) {
    return 'This shipment is not eligible for feedback yet.';
  }

  if (reasons.length === 1) {
    return reasons[0];
  }

  return `Feedback cannot be created yet. ${reasons.join(' ')}`;
};

export const getShipmentFeedbackApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
  context: FeedbackErrorContext = 'create',
): string => {
  const status = getStatusCode(error);
  const normalizedMessages = normalizeShipmentFeedbackReasons(getRawErrorMessages(error));

  if (status === 401) return 'Session expired. Please sign in again.';

  if (status === 403) {
    if (context === 'load') return 'You do not have access to this feedback record.';
    return 'You do not have permission to submit feedback for this shipment.';
  }

  if (status === 404) {
    return normalizedMessages[0] ?? 'No feedback exists for this shipment yet.';
  }

  if (status === 409) {
    return 'Feedback has already been submitted for this shipment.';
  }

  if (status === 422) {
    return normalizedMessages[0] ?? 'The feedback request contains invalid data.';
  }

  if (status === 500 || status === 502 || status === 503) {
    if (context === 'eligibility') {
      return 'We could not complete the feedback eligibility check right now. Please try again.';
    }
    return 'Feedback service is temporarily unavailable. Please try again.';
  }

  if (normalizedMessages.length === 1) {
    return normalizedMessages[0];
  }

  if (normalizedMessages.length > 1) {
    return normalizedMessages.join(' ');
  }

  return fallbackMessage;
};
