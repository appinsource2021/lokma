import type { Cents } from "./money";

export type FulfilmentMode = "DELIVERY" | "PICKUP";

export interface DeliveryZoneDef {
  radiusKm: number;
  deliveryFee: Cents;
  minOrder: Cents;
  etaMin: number;
  etaMax: number;
}

export interface FulfilmentTerms {
  mode: FulfilmentMode;
  deliveryFee: Cents;
  minOrder: Cents;
  etaMin: number;
  etaMax: number;
}

/** Customers may pick up from restaurants up to this distance away. */
export const PICKUP_MAX_KM = 15;

/**
 * Terms for ordering from a restaurant at the given distance, or null when the
 * restaurant does not serve that location. For delivery, the smallest zone
 * that contains the address wins, so inner zones can be cheaper.
 */
export function fulfilmentTerms(
  mode: FulfilmentMode,
  distanceKm: number,
  zones: DeliveryZoneDef[],
  prepMinutes: number,
): FulfilmentTerms | null {
  if (mode === "PICKUP") {
    if (distanceKm > PICKUP_MAX_KM) return null;
    return { mode, deliveryFee: 0, minOrder: 0, etaMin: prepMinutes, etaMax: prepMinutes + 10 };
  }
  const zone = zones
    .filter((z) => distanceKm <= z.radiusKm)
    .sort((a, b) => a.radiusKm - b.radiusKm)[0];
  if (!zone) return null;
  return {
    mode,
    deliveryFee: zone.deliveryFee,
    minOrder: zone.minOrder,
    etaMin: zone.etaMin,
    etaMax: zone.etaMax,
  };
}
