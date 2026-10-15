import { describe, expect, it } from "vitest";
import { distanceKm } from "./geo";
import { fulfilmentTerms, PICKUP_MAX_KM } from "./zones";

const zones = [
  { radiusKm: 6, deliveryFee: 300, minOrder: 2500, etaMin: 40, etaMax: 55 },
  { radiusKm: 2, deliveryFee: 0, minOrder: 1200, etaMin: 20, etaMax: 30 },
];

describe("fulfilmentTerms", () => {
  it("picks the smallest delivery zone that contains the address", () => {
    expect(fulfilmentTerms("DELIVERY", 1.5, zones, 15)?.deliveryFee).toBe(0);
    expect(fulfilmentTerms("DELIVERY", 4, zones, 15)?.minOrder).toBe(2500);
    expect(fulfilmentTerms("DELIVERY", 7, zones, 15)).toBeNull();
  });

  it("makes pickup free and limits it by distance", () => {
    expect(fulfilmentTerms("PICKUP", 10, zones, 15)).toEqual({
      mode: "PICKUP", deliveryFee: 0, minOrder: 0, etaMin: 15, etaMax: 25,
    });
    expect(fulfilmentTerms("PICKUP", PICKUP_MAX_KM + 1, zones, 15)).toBeNull();
  });
});

describe("distanceKm", () => {
  it("measures roughly 1 km per 0.009 degrees of latitude", () => {
    expect(distanceKm({ lat: 49.48, lng: 8.46 }, { lat: 49.489, lng: 8.46 })).toBeCloseTo(1.0, 1);
  });
});
