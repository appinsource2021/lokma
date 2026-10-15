"use client";

import { formatEuro } from "@lokma/core";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrder, type Order, type OrderStatus } from "@/lib/api";

const DELIVERY_STEPS: [OrderStatus, string][] = [
  ["PLACED", "Order sent"],
  ["ACCEPTED", "Accepted by the restaurant"],
  ["PREPARING", "Being prepared"],
  ["ON_THE_WAY", "On the way"],
  ["COMPLETED", "Delivered"],
];
const PICKUP_STEPS: [OrderStatus, string][] = [
  ["PLACED", "Order sent"],
  ["ACCEPTED", "Accepted by the restaurant"],
  ["PREPARING", "Being prepared"],
  ["READY_FOR_PICKUP", "Ready for pickup"],
  ["COMPLETED", "Picked up"],
];

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const load = () =>
      getOrder(id)
        .then(({ order }) => {
          setOrder(order);
          if (!["COMPLETED", "REJECTED", "CANCELLED"].includes(order.status)) timer = setTimeout(load, 15000);
        })
        .catch((e: Error) => setError(e.message));
    load();
    return () => clearTimeout(timer);
  }, [id]);

  if (error) return <p className="error">Could not load the order: {error}</p>;
  if (!order) return <div className="skeleton-list" aria-busy />;

  const steps = order.mode === "DELIVERY" ? DELIVERY_STEPS : PICKUP_STEPS;
  const current = steps.findIndex(([s]) => s === order.status);
  const stopped = order.status === "REJECTED" || order.status === "CANCELLED";
  const placed = new Date(order.placedAt);
  const eta = (min: number) =>
    new Date(placed.getTime() + min * 60000).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

  return (
    <div className="checkout-layout">
      <section className="card form">
        <p className="muted small">Order #{order.id.slice(-6).toUpperCase()}</p>
        <h1>{stopped ? "This order was " + order.status.toLowerCase() : `Thanks, ${order.customerName.split(" ")[0]}!`}</h1>
        {!stopped && (
          <p className="eta">
            Estimated {order.mode === "DELIVERY" ? "delivery" : "pickup"}: <strong>{eta(order.etaMin)}–{eta(order.etaMax)}</strong>
          </p>
        )}
        {!stopped && (
          <ol className="timeline">
            {steps.map(([status, label], i) => (
              <li key={status} className={i < current ? "done" : i === current ? "current" : ""}>
                {label}
              </li>
            ))}
          </ol>
        )}
        <p className="small muted">This page updates by itself.</p>
        {order.mode === "DELIVERY" && order.addressLine && <p>Delivering to {order.addressLine}</p>}
      </section>

      <aside className="cart-panel">
        <h2>{order.restaurant.name}</h2>
        <ul className="plain-list cart-lines">
          {order.items.map((l) => (
            <li key={l.id}>
              <div className="cart-line-top">
                <span>{l.quantity} × {l.name}</span>
                <span>{formatEuro(l.lineTotal)}</span>
              </div>
              {l.options.length > 0 && <p className="small muted">{l.options.map((o) => o.name).join(", ")}</p>}
            </li>
          ))}
        </ul>
        <dl className="totals">
          <dt>Subtotal</dt>
          <dd>{formatEuro(order.subtotal)}</dd>
          {order.discount > 0 && (
            <>
              <dt>{order.promotionLabel ?? "Discount"}</dt>
              <dd className="free">−{formatEuro(order.discount)}</dd>
            </>
          )}
          <dt>Delivery</dt>
          <dd>{order.deliveryFee === 0 ? "Free" : formatEuro(order.deliveryFee)}</dd>
          <dt className="strong">Total</dt>
          <dd className="strong">{formatEuro(order.total)}</dd>
        </dl>
        <Link href={`/r/${order.restaurant.slug}`} className="small">Order again from {order.restaurant.name}</Link>
      </aside>
    </div>
  );
}
