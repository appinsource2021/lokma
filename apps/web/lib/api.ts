import type { CartQuote, FulfilmentMode, FulfilmentTerms, ItemDef, PromotionDef } from "@lokma/core";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface RestaurantSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  cuisines: string[];
  rating: number;
  ratingCount: number;
  isNew: boolean;
  coverHue: number;
  promotions: { id: string; label: string }[];
  distanceKm: number;
  terms: FulfilmentTerms | null;
  isOpen: boolean;
  opensAt: string | null;
}

export interface MenuItem extends ItemDef {
  description: string;
  tags: string[];
  allergens: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface RestaurantDetail extends RestaurantSummary {
  street: string;
  city: string;
  promotionTerms: PromotionDef[];
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  options: { id: string; name: string; priceDelta: number }[];
}

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "ON_THE_WAY"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface Order {
  id: string;
  mode: FulfilmentMode;
  status: OrderStatus;
  customerName: string;
  addressLine: string | null;
  note: string | null;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  promotionLabel: string | null;
  etaMin: number;
  etaMax: number;
  placedAt: string;
  restaurant: { slug: string; name: string };
  items: OrderItem[];
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { error?: string; message?: string; quote?: CartQuote; opensAt?: string | null },
  ) {
    super(body.message ?? body.error ?? `Request failed (${status})`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export interface ListFilters {
  q?: string;
  cuisine?: string;
  freeDelivery?: boolean;
  offers?: boolean;
  openNow?: boolean;
  sort?: string;
}

export function listRestaurants(lat: number, lng: number, mode: FulfilmentMode, f: ListFilters) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), mode });
  if (f.q) params.set("q", f.q);
  if (f.cuisine) params.set("cuisine", f.cuisine);
  if (f.freeDelivery) params.set("freeDelivery", "1");
  if (f.offers) params.set("offers", "1");
  if (f.openNow) params.set("openNow", "1");
  if (f.sort) params.set("sort", f.sort);
  return request<{ restaurants: RestaurantSummary[]; cuisines: string[] }>(`/restaurants?${params}`);
}

export function getRestaurant(slug: string, point: { lat: number; lng: number } | null, mode: FulfilmentMode) {
  const params = new URLSearchParams({ mode });
  if (point) {
    params.set("lat", String(point.lat));
    params.set("lng", String(point.lng));
  }
  return request<{ restaurant: RestaurantDetail; menu: MenuCategory[] }>(`/restaurants/${encodeURIComponent(slug)}?${params}`);
}

export interface OrderInput {
  restaurantSlug: string;
  mode: FulfilmentMode;
  address: { line: string; lat: number; lng: number };
  lines: { itemId: string; quantity: number; optionIds: string[] }[];
}

export function quoteOrder(input: OrderInput) {
  return request<{ quote: CartQuote; terms: FulfilmentTerms; isOpen: boolean; opensAt: string | null }>(
    "/orders/quote",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function placeOrder(input: OrderInput & { customer: { name: string; phone: string }; note?: string }) {
  return request<{ order: Order }>("/orders", { method: "POST", body: JSON.stringify(input) });
}

export function getOrder(id: string) {
  return request<{ order: Order }>(`/orders/${encodeURIComponent(id)}`);
}
