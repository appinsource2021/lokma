"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppState } from "@/lib/state";
import { AddressSheet } from "./AddressSheet";

export function Header() {
  const { ready, address, mode, setMode, cart } = useAppState();
  const [sheetOpen, setSheetOpen] = useState(false);
  const count = cart?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Lokma home">
          <span className="brand-mark" aria-hidden>◐</span> lokma
        </Link>
        <button className="address-button" onClick={() => setSheetOpen(true)} disabled={!ready}>
          <span className="muted small">{mode === "DELIVERY" ? "Deliver to" : "Pick up near"}</span>
          <span className="address-label">{address ? address.label : "Choose your address"} ▾</span>
        </button>
        <div className="segmented" role="group" aria-label="Fulfilment">
          <button aria-pressed={mode === "DELIVERY"} onClick={() => setMode("DELIVERY")}>Delivery</button>
          <button aria-pressed={mode === "PICKUP"} onClick={() => setMode("PICKUP")}>Pickup</button>
        </div>
        {count > 0 && cart && (
          <Link href={`/r/${cart.restaurantSlug}`} className="cart-pill">
            Cart · {count}
          </Link>
        )}
      </div>
      {sheetOpen && <AddressSheet onClose={() => setSheetOpen(false)} />}
    </header>
  );
}
