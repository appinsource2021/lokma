"use client";

import type { FulfilmentMode } from "@lokma/core";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface SavedAddress {
  label: string;
  /** Street and house number for the courier, typed by the customer. */
  line: string;
  lat: number;
  lng: number;
}

export interface CartLine {
  key: string;
  itemId: string;
  name: string;
  optionIds: string[];
  optionNames: string[];
  unitPrice: number;
  quantity: number;
}

export interface Cart {
  restaurantSlug: string;
  restaurantName: string;
  lines: CartLine[];
}

interface AppState {
  ready: boolean;
  address: SavedAddress | null;
  setAddress: (a: SavedAddress | null) => void;
  mode: FulfilmentMode;
  setMode: (m: FulfilmentMode) => void;
  cart: Cart | null;
  /** Adds a line. A cart from another restaurant is replaced; confirm that first. */
  addToCart: (restaurant: { slug: string; name: string }, line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
}

const Ctx = createContext<AppState | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); state then lives in memory only.
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [address, setAddressState] = useState<SavedAddress | null>(null);
  const [mode, setModeState] = useState<FulfilmentMode>("DELIVERY");
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    setAddressState(load("lokma.address", null));
    setModeState(load("lokma.mode", "DELIVERY"));
    setCart(load("lokma.cart", null));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save("lokma.cart", cart && cart.lines.length > 0 ? cart : null);
  }, [cart, ready]);

  const setAddress = useCallback((a: SavedAddress | null) => {
    setAddressState(a);
    save("lokma.address", a);
  }, []);

  const setMode = useCallback((m: FulfilmentMode) => {
    setModeState(m);
    save("lokma.mode", m);
  }, []);

  const addToCart = useCallback<AppState["addToCart"]>((restaurant, line) => {
    const key = `${line.itemId}:${[...line.optionIds].sort().join(",")}`;
    setCart((current) => {
      const base =
        current && current.restaurantSlug === restaurant.slug
          ? current
          : { restaurantSlug: restaurant.slug, restaurantName: restaurant.name, lines: [] };
      const existing = base.lines.find((l) => l.key === key);
      const lines = existing
        ? base.lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l))
        : [...base.lines, { ...line, key }];
      return { ...base, lines };
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setCart((current) => {
      if (!current) return current;
      const lines = current.lines
        .map((l) => (l.key === key ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0);
      return lines.length ? { ...current, lines } : null;
    });
  }, []);

  const clearCart = useCallback(() => setCart(null), []);

  const value = useMemo(
    () => ({ ready, address, setAddress, mode, setMode, cart, addToCart, setQuantity, clearCart }),
    [ready, address, setAddress, mode, setMode, cart, addToCart, setQuantity, clearCart],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
