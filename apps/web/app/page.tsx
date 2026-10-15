"use client";

import { useEffect, useState } from "react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { listRestaurants, type ListFilters, type RestaurantSummary } from "@/lib/api";
import { DEMO_AREAS } from "@/lib/places";
import { useAppState } from "@/lib/state";

const SORTS = [
  ["recommended", "Recommended"],
  ["rating", "Rating"],
  ["eta", "Fastest"],
  ["fee", "Delivery fee"],
  ["distance", "Distance"],
] as const;

export default function Home() {
  const { ready, address, setAddress, mode } = useAppState();
  const [filters, setFilters] = useState<ListFilters>({ sort: "recommended" });
  const [query, setQuery] = useState("");
  const [data, setData] = useState<{ restaurants: RestaurantSummary[]; cuisines: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: query.trim() || undefined })), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setError(null);
    listRestaurants(address.lat, address.lng, mode, filters)
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [address, mode, filters]);

  if (!ready) return <div className="skeleton-list" aria-busy />;

  if (!address) {
    return (
      <section className="hero">
        <h1>Hungry? Tell us where you are.</h1>
        <p className="muted">Pick an area to see restaurants that deliver to you.</p>
        <div className="chips">
          {DEMO_AREAS.map((a) => (
            <button key={a.label} className="chip" onClick={() => setAddress({ label: a.label, line: "", lat: a.lat, lng: a.lng })}>
              {a.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  const toggle = (key: "freeDelivery" | "offers" | "openNow") => setFilters((f) => ({ ...f, [key]: !f[key] }));
  const open = data?.restaurants.filter((r) => r.isOpen) ?? [];
  const closed = data?.restaurants.filter((r) => !r.isOpen) ?? [];

  return (
    <>
      <div className="search-row">
        <input
          className="search"
          type="search"
          placeholder="Search restaurants or cuisines"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} aria-label="Sort by">
          {SORTS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="chips scroll">
        <button className="chip" aria-pressed={!filters.cuisine} onClick={() => setFilters((f) => ({ ...f, cuisine: undefined }))}>All</button>
        {data?.cuisines.map((c) => (
          <button key={c} className="chip" aria-pressed={filters.cuisine === c} onClick={() => setFilters((f) => ({ ...f, cuisine: f.cuisine === c ? undefined : c }))}>
            {c}
          </button>
        ))}
      </div>
      <div className="chips">
        <button className="chip" aria-pressed={!!filters.offers} onClick={() => toggle("offers")}>% Offers</button>
        {mode === "DELIVERY" && <button className="chip" aria-pressed={!!filters.freeDelivery} onClick={() => toggle("freeDelivery")}>Free delivery</button>}
        <button className="chip" aria-pressed={!!filters.openNow} onClick={() => toggle("openNow")}>Open now</button>
      </div>

      {error && <p className="error">Could not load restaurants: {error}</p>}
      {!data && !error && <div className="skeleton-list" aria-busy />}
      {data && (
        <>
          <h2 className="section-title">
            {data.restaurants.length === 0
              ? "No restaurants match here"
              : `${open.length} open ${mode === "DELIVERY" ? "and delivering to you" : "for pickup near you"}`}
          </h2>
          <div className="grid">
            {open.map((r) => <RestaurantCard key={r.id} r={r} />)}
          </div>
          {closed.length > 0 && (
            <>
              <h2 className="section-title muted">Closed right now</h2>
              <div className="grid">
                {closed.map((r) => <RestaurantCard key={r.id} r={r} />)}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
