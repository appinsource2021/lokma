"use client";

import { formatEuro, type CartQuote } from "@lokma/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Totals } from "@/components/CartPanel";
import { ApiError, placeOrder, quoteOrder, type OrderInput } from "@/lib/api";
import { useAppState } from "@/lib/state";

export default function CheckoutPage() {
  const router = useRouter();
  const { ready, address, setAddress, mode, cart, clearCart } = useAppState();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (address) setStreet((s) => s || address.line);
  }, [address]);

  const input: OrderInput | null =
    cart && address
      ? {
          restaurantSlug: cart.restaurantSlug,
          mode,
          address: { line: street.trim() || address.label, lat: address.lat, lng: address.lng },
          lines: cart.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, optionIds: l.optionIds })),
        }
      : null;
  const inputKey = input ? JSON.stringify({ ...input, address: { ...input.address, line: "" } }) : "";

  useEffect(() => {
    if (!input) return;
    setProblem(null);
    quoteOrder(input)
      .then((res) => {
        setQuote(res.quote);
        if (!res.isOpen) setProblem(res.opensAt ? `The restaurant is closed. It opens at ${res.opensAt}.` : "The restaurant is closed right now.");
        else if (!res.quote.ok) setProblem(res.quote.errors[0]?.message ?? "Please check your cart.");
      })
      .catch((e: Error) => setProblem(e.message));
    // The quote only depends on the cart, mode and location, not on the typed street.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);

  if (!ready) return <div className="skeleton-list" aria-busy />;
  if (!cart || !address || !input) {
    return (
      <section className="hero">
        <h1>Nothing to check out yet</h1>
        <p className="muted">{!address ? "Choose an address first." : "Your cart is empty."}</p>
        <Link className="primary" href="/">Find restaurants</Link>
      </section>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setProblem(null);
    try {
      if (mode === "DELIVERY" && street.trim() !== address.line) setAddress({ ...address, line: street.trim() });
      const { order } = await placeOrder({ ...input, customer: { name, phone }, note: note || undefined });
      clearCart();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.body.quote) setQuote(err.body.quote);
      setProblem(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-layout">
      <form className="card form" onSubmit={submit}>
        <h1>Checkout</h1>
        <p className="muted">
          {mode === "DELIVERY" ? "Delivery" : "Pickup"} from <strong>{cart.restaurantName}</strong>
        </p>

        {mode === "DELIVERY" && (
          <label className="field">
            <span>Street and house number</span>
            <input required minLength={3} value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="street-address" />
            <span className="small muted">Area: {address.label}</span>
          </label>
        )}
        <label className="field">
          <span>Name</span>
          <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="field">
          <span>Phone</span>
          <input required type="tel" pattern="\+?[0-9 \(\)\/\-]{6,20}" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          <span className="small muted">The restaurant or courier calls this number if needed.</span>
        </label>
        <label className="field">
          <span>Note for the restaurant (optional)</span>
          <textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </label>

        <fieldset className="option-group">
          <legend>Payment</legend>
          <label className="option">
            <input type="radio" checked readOnly /> <span>Pay {mode === "DELIVERY" ? "on delivery" : "at pickup"} (cash or card)</span>
          </label>
          <p className="small muted">Online payment is coming later.</p>
        </fieldset>

        {problem && <p className="notice">{problem}</p>}
        <button className="primary block" disabled={submitting || !quote?.ok || !!problem}>
          {submitting ? "Placing order…" : quote ? `Place order · ${formatEuro(quote.total)}` : "Place order"}
        </button>
      </form>

      <aside className="cart-panel">
        <h2>Summary</h2>
        <ul className="plain-list cart-lines">
          {(quote?.lines ?? []).map((l, i) => (
            <li key={i}>
              <div className="cart-line-top">
                <span>{l.quantity} × {l.name}</span>
                <span>{formatEuro(l.lineTotal)}</span>
              </div>
              {l.options.length > 0 && <p className="small muted">{l.options.map((o) => o.name).join(", ")}</p>}
            </li>
          ))}
        </ul>
        {quote && <Totals quote={quote} />}
        <Link href={`/r/${cart.restaurantSlug}`} className="small">← Edit order</Link>
      </aside>
    </div>
  );
}
