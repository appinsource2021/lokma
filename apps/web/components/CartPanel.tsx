"use client";

import { formatEuro, type CartQuote } from "@lokma/core";
import Link from "next/link";
import type { Cart } from "@/lib/state";
import { useAppState } from "@/lib/state";

export function CartPanel({
  cart,
  quote,
  canOrder,
  blockedReason,
}: {
  cart: Cart | null;
  quote: CartQuote | null;
  canOrder: boolean;
  blockedReason: string | null;
}) {
  const { setQuantity } = useAppState();

  if (!cart || cart.lines.length === 0) {
    return (
      <aside className="cart-panel">
        <h2>Your order</h2>
        <p className="muted">Your cart is empty. Add something from the menu.</p>
      </aside>
    );
  }

  return (
    <aside className="cart-panel">
      <h2>Your order</h2>
      <ul className="plain-list cart-lines">
        {cart.lines.map((l) => (
          <li key={l.key}>
            <div className="cart-line-top">
              <span>{l.name}</span>
              <span>{formatEuro(l.unitPrice * l.quantity)}</span>
            </div>
            {l.optionNames.length > 0 && <p className="small muted">{l.optionNames.join(", ")}</p>}
            <div className="stepper small">
              <button onClick={() => setQuantity(l.key, l.quantity - 1)} aria-label={`Fewer ${l.name}`}>−</button>
              <span>{l.quantity}</span>
              <button onClick={() => setQuantity(l.key, Math.min(50, l.quantity + 1))} aria-label={`More ${l.name}`}>+</button>
            </div>
          </li>
        ))}
      </ul>
      {quote && <Totals quote={quote} />}
      {quote && quote.minOrderShortfall > 0 && (
        <p className="notice small">Add {formatEuro(quote.minOrderShortfall)} more to reach the minimum order.</p>
      )}
      {blockedReason && <p className="notice small">{blockedReason}</p>}
      {canOrder ? (
        <Link href="/checkout" className="primary block">Go to checkout</Link>
      ) : (
        <button className="primary block" disabled>Go to checkout</button>
      )}
    </aside>
  );
}

export function Totals({ quote }: { quote: CartQuote }) {
  return (
    <dl className="totals">
      <dt>Subtotal</dt>
      <dd>{formatEuro(quote.subtotal)}</dd>
      {quote.discount > 0 && (
        <>
          <dt>{quote.promotion?.label ?? "Discount"}</dt>
          <dd className="free">−{formatEuro(quote.discount)}</dd>
        </>
      )}
      <dt>Delivery</dt>
      <dd>{quote.deliveryFee === 0 ? "Free" : formatEuro(quote.deliveryFee)}</dd>
      <dt className="strong">Total</dt>
      <dd className="strong">{formatEuro(quote.total)}</dd>
    </dl>
  );
}
