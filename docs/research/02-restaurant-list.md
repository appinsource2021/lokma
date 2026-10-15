# Home feed and restaurant list

Source: screen recording of the iOS app, 2026-10-15, 00:06–00:40.

## What the user sees

Top to bottom on the home tab:

1. **Header**: address picker, fulfilment toggle (delivery or pickup), and a
   second icon next to it.
2. **Search bar** with a rotating placeholder that cycles through what can be
   searched (categories, groceries, restaurants, items). Next to it are a
   **filter** button and an AI/assistant button (sparkle icon).
3. **Vertical tabs**: restaurants, alcohol, kiosks, sweets. Switching vertical
   reloads the whole feed. Some verticals have very few partners nearby
   ("2 partners").
4. **Cuisine carousel** (pizza, Chinese, burger, Italian, Indian…) with a
   "see all" link.
5. **Quick filter chips**: offers, free delivery, favourites, vegetarian, stamp
   cards (the chips vary by vertical).
6. **Promo banners**: a horizontal carousel of sponsored deals for one brand.
7. **Order again**: restaurants from the user's history.
8. **Curated horizontal rails**: "suggestions for you", "delivery under €2",
   "deals", "top rated nearby", "deals of the day".
9. **Full list** with a "you can order from N partners" count and an info icon,
   then a vertical list of cards.
10. **Pre-order rail** for partners that are closed now but open later
    ("opens at 23:00").
11. **Bottom tab bar**: Home, Orders, Rewards, Account.

## Restaurant card

- Hero image and the restaurant's logo badge.
- Optional ribbons: discount ("10% off from €15", "2 for 1", "buy one get
  second half price", "free product"), **sponsored** label, **stamp card**
  label, **new** badge.
- Name and favourite (heart) toggle.
- Rating with the review count bucketed ("4.6 (1,600+)"), ETA in minutes,
  distance in km, delivery fee (or "free delivery" chip) and minimum order
  ("Min. 35 €").
- When closed: the card or page shows a "currently closed" state.

## Rules and edge cases

- Sponsored entries are interleaved in the main list and clearly labelled.
- Ratings show "new" instead of a score when there are few reviews.
- Rails reuse the same card in a compact size.
- Loading uses skeletons, not spinners.

## Data involved

`Restaurant { id, name, logo, heroImage, cuisines[], rating, ratingCount,
isNew, priceLevel?, openingHours[], isOpenNow, opensAt? }`
`DeliveryZone { restaurantId, area, fee, minOrder, etaMin, etaMax }`
`Promotion { id, restaurantId, type: percent|fixed|bogo|second_half|free_item,
value, minSubtotal?, appliesTo: all|items[], startsAt, endsAt, sponsored }`

## Lokma decision

- MVP: one vertical (restaurants), cuisine filter, chips for offers, free
  delivery and favourites, sort by recommended, rating, ETA and fee, then the
  full list. Rails come in phase 2.
- Search: one box across restaurants, cuisines and dishes.
- Sponsored placement and the AI assistant are out of scope for the MVP.

## Evidence

Screen recording, 00:06–00:40 and 00:45–00:46.
