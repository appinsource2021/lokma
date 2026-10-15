"use client";

import { formatEuro, fromPrice, priceCart, type ItemDef } from "@lokma/core";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CartPanel } from "@/components/CartPanel";
import { Cover } from "@/components/Cover";
import { ItemDialog } from "@/components/ItemDialog";
import { getRestaurant, type MenuCategory, type MenuItem, type RestaurantDetail } from "@/lib/api";
import { useAppState } from "@/lib/state";

export default function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const { ready, address, mode, cart, addToCart } = useAppState();
  const [data, setData] = useState<{ restaurant: RestaurantDetail; menu: MenuCategory[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (!ready) return;
    getRestaurant(slug, address, mode)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [slug, ready, address, mode]);

  const items = useMemo(() => {
    const map = new Map<string, ItemDef>();
    data?.menu.forEach((c) => c.items.forEach((i) => map.set(i.id, i)));
    return map;
  }, [data]);

  if (error) return <p className="error">Could not load this restaurant: {error}</p>;
  if (!data) return <div className="skeleton-list" aria-busy />;

  const { restaurant: r, menu } = data;
  const myCart = cart?.restaurantSlug === r.slug ? cart : null;
  const quote =
    myCart && r.terms
      ? priceCart({
          items,
          lines: myCart.lines,
          deliveryFee: r.terms.deliveryFee,
          minOrder: r.terms.minOrder,
          promotions: r.promotionTerms,
        })
      : null;

  const blockedReason = !address
    ? "Choose an address first."
    : !r.terms
      ? mode === "DELIVERY"
        ? "This restaurant does not deliver to your address."
        : "This restaurant is too far away for pickup."
      : !r.isOpen
        ? r.opensAt ? `Closed now. Opens at ${r.opensAt}.` : "Closed right now."
        : null;
  const canOrder = !blockedReason && !!quote?.ok;

  const add = (item: MenuItem, optionIds: string[], quantity: number) => {
    if (cart && cart.restaurantSlug !== r.slug && cart.lines.length > 0) {
      if (!confirm(`Your cart has items from ${cart.restaurantName}. Start a new cart for ${r.name}?`)) return;
    }
    const options = item.optionGroups.flatMap((g) => g.options).filter((o) => optionIds.includes(o.id));
    addToCart(
      { slug: r.slug, name: r.name },
      {
        itemId: item.id,
        name: item.name,
        optionIds,
        optionNames: options.map((o) => o.name),
        unitPrice: item.basePrice + options.reduce((s, o) => s + o.priceDelta, 0),
        quantity,
      },
    );
    setOpenItem(null);
  };

  return (
    <div className="restaurant-layout">
      <div>
        <Cover name={r.name} hue={r.coverHue} height={180} />
        <div className="restaurant-head">
          <h1>{r.name}</h1>
          <p className="muted">{r.description}</p>
          <p className="meta small">
            {r.isNew ? <span className="badge">New</span> : <span>★ {r.rating.toFixed(1)} ({r.ratingCount})</span>}
            <span>{r.street}, {r.city}</span>
            {r.terms && <span>{r.terms.etaMin}–{r.terms.etaMax} min</span>}
            {r.terms && r.terms.mode === "DELIVERY" && (
              <span>{r.terms.minOrder > 0 ? `Min. ${formatEuro(r.terms.minOrder)}` : "No minimum order"}</span>
            )}
          </p>
          {r.promotionTerms.map((p) => (
            <p key={p.id} className="promo-bar">% {p.label}</p>
          ))}
          {blockedReason && <p className="notice">{blockedReason}</p>}
        </div>

        <nav className="chips scroll sticky-tabs" aria-label="Menu categories">
          {menu.map((c) => (
            <a key={c.id} href={`#cat-${c.id}`} className="chip">{c.name}</a>
          ))}
        </nav>

        {menu.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="menu-section">
            <h2>{c.name}</h2>
            <div className="menu-grid">
              {c.items.map((i) => {
                const price = fromPrice(i);
                const varies = i.optionGroups.some((g) => g.options.some((o) => o.priceDelta !== 0));
                return (
                  <button
                    key={i.id}
                    className="card menu-item"
                    disabled={!i.available}
                    onClick={() => (i.optionGroups.length ? setOpenItem(i) : add(i, [], 1))}
                  >
                    <div>
                      <h3>{i.name}</h3>
                      {i.description && <p className="small muted">{i.description}</p>}
                      {i.tags.length > 0 && <p className="small tags">{i.tags.join(" · ")}</p>}
                      <p className="price">{!i.available ? "Sold out" : `${varies ? "from " : ""}${formatEuro(price)}`}</p>
                    </div>
                    {i.available && <span className="add" aria-hidden>+</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <CartPanel cart={myCart} quote={quote} canOrder={canOrder} blockedReason={myCart ? blockedReason : null} />

      {openItem && <ItemDialog item={openItem} onClose={() => setOpenItem(null)} onAdd={(ids, q) => add(openItem, ids, q)} />}
    </div>
  );
}
