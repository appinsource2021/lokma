import { formatEuro } from "@lokma/core";
import Link from "next/link";
import type { RestaurantSummary } from "@/lib/api";
import { Cover } from "./Cover";

export function RestaurantCard({ r }: { r: RestaurantSummary }) {
  const t = r.terms!;
  return (
    <Link href={`/r/${r.slug}`} className={`card restaurant-card${r.isOpen ? "" : " closed"}`}>
      <div className="cover-wrap">
        <Cover name={r.name} hue={r.coverHue} />
        {r.promotions[0] && <span className="ribbon">{r.promotions[0].label}</span>}
        {!r.isOpen && <span className="closed-badge">{r.opensAt ? `Opens at ${r.opensAt}` : "Closed now"}</span>}
      </div>
      <div className="card-body">
        <h3>{r.name}</h3>
        <p className="muted small">{r.cuisines.join(" · ")}</p>
        <p className="meta small">
          {r.isNew ? <span className="badge">New</span> : <span>★ {r.rating.toFixed(1)} ({r.ratingCount > 1000 ? `${Math.floor(r.ratingCount / 100) * 100}+` : r.ratingCount})</span>}
          <span>{t.etaMin}–{t.etaMax} min</span>
          <span>{r.distanceKm.toLocaleString("de-DE")} km</span>
          {t.mode === "DELIVERY" && (
            <>
              <span className={t.deliveryFee === 0 ? "free" : ""}>{t.deliveryFee === 0 ? "Free delivery" : `${formatEuro(t.deliveryFee)} delivery`}</span>
              {t.minOrder > 0 && <span>Min. {formatEuro(t.minOrder)}</span>}
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
