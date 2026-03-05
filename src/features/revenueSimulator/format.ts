import {
  FALLBACK_CONTROL_VALUES,
  MIX_CONTROL_IDS,
} from '@/features/revenueSimulator/constants';
import type {
  MixControlId,
  RevenueSimulatorControls,
} from '@/features/revenueSimulator/types';

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-NG', {
  maximumFractionDigits: 1,
});

export interface IsoMonthRange {
  startDate: string;
  endDate: string;
}

export const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const safeDivide = (numerator: number, denominator: number, fallback = 0): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  return numerator / denominator;
};

export const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return 'N/A';
  return CURRENCY_FORMATTER.format(value);
};

export const formatCompactCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return 'N/A';
  return COMPACT_CURRENCY_FORMATTER.format(value);
};

export const formatNumber = (value: number, decimals = 0): string => {
  if (!Number.isFinite(value)) return 'N/A';
  if (decimals === 0) return Math.round(value).toLocaleString('en-NG');
  return NUMBER_FORMATTER.format(roundTo(value, decimals));
};

export const formatNumberWithUnit = (
  value: number,
  unit: string,
  decimals = 0,
): string => {
  return `${formatNumber(value, decimals)} ${unit}`.trim();
};

export const formatPercent = (value: number, decimals = 1): string => {
  if (!Number.isFinite(value)) return 'N/A';
  return `${roundTo(value, decimals)}%`;
};

export const normalizeMixControls = (
  controls: RevenueSimulatorControls,
): RevenueSimulatorControls => {
  const so = Math.max(0, controls.soMix);
  const stpo = Math.max(0, controls.stpoMix);
  const bulk = Math.max(0, controls.bulkMix);
  const total = so + stpo + bulk;

  if (total <= 0) {
    return {
      ...controls,
      soMix: FALLBACK_CONTROL_VALUES.soMix,
      stpoMix: FALLBACK_CONTROL_VALUES.stpoMix,
      bulkMix: FALLBACK_CONTROL_VALUES.bulkMix,
    };
  }

  const normalizedSo = roundTo((so / total) * 100, 1);
  const normalizedStpo = roundTo((stpo / total) * 100, 1);
  const normalizedBulk = roundTo((bulk / total) * 100, 1);

  const diff = roundTo(100 - (normalizedSo + normalizedStpo + normalizedBulk), 1);

  return {
    ...controls,
    soMix: normalizedSo,
    stpoMix: roundTo(normalizedStpo + diff, 1),
    bulkMix: normalizedBulk,
  };
};

export const applyMixControlChange = (
  controls: RevenueSimulatorControls,
  controlId: MixControlId,
  nextValue: number,
): RevenueSimulatorControls => {
  const clampedNext = clampNumber(nextValue, 0, 100);
  const remainingIds = MIX_CONTROL_IDS.filter((id) => id !== controlId);
  const remainingCurrentTotal = remainingIds.reduce((sum, id) => sum + Math.max(controls[id], 0), 0);
  const targetRemaining = 100 - clampedNext;

  const nextControls: RevenueSimulatorControls = { ...controls, [controlId]: clampedNext };

  if (remainingCurrentTotal <= 0) {
    const equalShare = roundTo(targetRemaining / remainingIds.length, 1);
    remainingIds.forEach((id) => {
      nextControls[id] = equalShare;
    });
  } else {
    remainingIds.forEach((id) => {
      const proportional = safeDivide(Math.max(controls[id], 0), remainingCurrentTotal, 0);
      nextControls[id] = roundTo(targetRemaining * proportional, 1);
    });
  }

  return normalizeMixControls(nextControls);
};

export const getCurrentMonthDateRange = (date = new Date()): IsoMonthRange => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();

  const monthText = String(month).padStart(2, '0');
  return {
    startDate: `${year}-${monthText}-01`,
    endDate: `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`,
  };
};
