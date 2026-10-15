import {
  distanceKm,
  fulfilmentTerms,
  isOpenAt,
  nextOpeningToday,
  type FulfilmentMode,
  type FulfilmentTerms,
  type ItemDef,
  type LatLng,
  type OpeningPeriod,
  type PromotionDef,
} from "@lokma/core";
import type { Prisma } from "@prisma/client";

export const restaurantWithTerms = {
  zones: true,
  promotions: true,
} satisfies Prisma.RestaurantInclude;

export const restaurantWithMenu = {
  ...restaurantWithTerms,
  categories: {
    orderBy: { sort: "asc" },
    include: {
      items: {
        orderBy: { sort: "asc" },
        include: {
          optionGroups: {
            orderBy: { sort: "asc" },
            include: { options: { orderBy: { sort: "asc" } } },
          },
        },
      },
    },
  },
} satisfies Prisma.RestaurantInclude;

type RestaurantRow = Prisma.RestaurantGetPayload<{ include: typeof restaurantWithTerms }>;
type RestaurantWithMenu = Prisma.RestaurantGetPayload<{ include: typeof restaurantWithMenu }>;

export function activePromotions(row: RestaurantRow, now: Date): PromotionDef[] {
  return row.promotions
    .filter((p) => p.active && (!p.startsAt || p.startsAt <= now) && (!p.endsAt || p.endsAt > now))
    .map((p) => ({ id: p.id, kind: p.kind, value: p.value, minSubtotal: p.minSubtotal, label: p.label }));
}

export interface Availability {
  distanceKm: number;
  terms: FulfilmentTerms | null;
  isOpen: boolean;
  opensAt: string | null;
}

export function availability(
  row: RestaurantRow,
  point: LatLng | null,
  mode: FulfilmentMode,
  now: Date,
): Availability {
  const hours = row.openingHours as unknown as OpeningPeriod[];
  const distance = point ? distanceKm(point, row) : Number.POSITIVE_INFINITY;
  const isOpen = isOpenAt(hours, now);
  return {
    distanceKm: Math.round(distance * 10) / 10,
    terms: point ? fulfilmentTerms(mode, distance, row.zones, row.prepMinutes) : null,
    isOpen,
    opensAt: isOpen ? null : nextOpeningToday(hours, now),
  };
}

export function summary(row: RestaurantRow, avail: Availability, now: Date) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    cuisines: row.cuisines,
    rating: row.rating,
    ratingCount: row.ratingCount,
    isNew: row.ratingCount < 10,
    coverHue: row.coverHue,
    promotions: activePromotions(row, now).map((p) => ({ id: p.id, label: p.label })),
    ...avail,
  };
}

export function menuItems(row: RestaurantWithMenu): Map<string, ItemDef> {
  const items = new Map<string, ItemDef>();
  for (const category of row.categories) {
    for (const item of category.items) {
      items.set(item.id, {
        id: item.id,
        name: item.name,
        basePrice: item.basePrice,
        available: item.available,
        optionGroups: item.optionGroups.map((g) => ({
          id: g.id,
          name: g.name,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          options: g.options.map((o) => ({ id: o.id, name: o.name, priceDelta: o.priceDelta })),
        })),
      });
    }
  }
  return items;
}

export function menu(row: RestaurantWithMenu) {
  return row.categories.map((c) => ({
    id: c.id,
    name: c.name,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      basePrice: i.basePrice,
      available: i.available,
      tags: i.tags,
      allergens: i.allergens,
      optionGroups: i.optionGroups.map((g) => ({
        id: g.id,
        name: g.name,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        options: g.options.map((o) => ({ id: o.id, name: o.name, priceDelta: o.priceDelta })),
      })),
    })),
  }));
}
