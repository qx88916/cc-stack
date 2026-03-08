/**
 * Fare calculation — reads from Settings model (admin-configurable) with env var fallback.
 */

import { getSettings } from '../models/Settings';

interface FareConfig {
  baseFare: number;
  perKm: number;
  perMin: number;
  currency: string;
  surgeMultiplier: number;
  taxRate: number;
}

const ENV_DEFAULTS: FareConfig = {
  baseFare: Number(process.env.FARE_BASE) || 3.0,
  perKm: Number(process.env.FARE_PER_KM) || 1.5,
  perMin: Number(process.env.FARE_PER_MIN) || 0.20,
  currency: process.env.FARE_CURRENCY || 'FJD',
  surgeMultiplier: Number(process.env.FARE_SURGE_MULTIPLIER) || 1.0,
  taxRate: Number(process.env.FARE_TAX_RATE) || 0.0,
};

async function loadFareConfig(): Promise<FareConfig> {
  try {
    const settings = await getSettings();
    const fare = settings.fare;
    if (fare) {
      return {
        baseFare: fare.baseFare ?? ENV_DEFAULTS.baseFare,
        perKm: fare.perKmRate ?? ENV_DEFAULTS.perKm,
        perMin: fare.perMinuteRate ?? ENV_DEFAULTS.perMin,
        currency: ENV_DEFAULTS.currency,
        surgeMultiplier: fare.surgeMultiplier ?? ENV_DEFAULTS.surgeMultiplier,
        taxRate: fare.taxRate ?? ENV_DEFAULTS.taxRate,
      };
    }
  } catch {
    // DB not available — fall back to env
  }
  return ENV_DEFAULTS;
}

export interface FareInput {
  distanceKm: number;
  durationMinutes: number;
  applySurge?: boolean;
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  subtotal: number;
  surge: number;
  surgeMultiplier: number;
  tax: number;
  total: number;
}

export interface FareResult {
  amount: number;
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  breakdown: FareBreakdown;
}

export async function calculateFare(input: FareInput): Promise<FareResult> {
  const config = await loadFareConfig();
  const { distanceKm, durationMinutes, applySurge = false } = input;

  const distanceCharge = distanceKm * config.perKm;
  const timeCharge = durationMinutes * config.perMin;
  const subtotal = config.baseFare + distanceCharge + timeCharge;

  const effectiveSurge = applySurge ? config.surgeMultiplier : 1.0;
  const surgeAmount = subtotal * (effectiveSurge - 1);

  const beforeTax = subtotal + surgeAmount;
  const taxAmount = beforeTax * config.taxRate;
  const total = beforeTax + taxAmount;

  const round = (n: number) => Math.round(n * 100) / 100;

  const breakdown: FareBreakdown = {
    baseFare: round(config.baseFare),
    distanceCharge: round(distanceCharge),
    timeCharge: round(timeCharge),
    subtotal: round(subtotal),
    surge: round(surgeAmount),
    surgeMultiplier: effectiveSurge,
    tax: round(taxAmount),
    total: round(total),
  };

  return {
    amount: breakdown.total,
    currency: config.currency,
    distanceKm,
    durationMinutes,
    breakdown,
  };
}

export async function getFareConfig(): Promise<FareConfig> {
  return loadFareConfig();
}
