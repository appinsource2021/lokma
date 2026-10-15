# Roadmap

## Done (MVP slice)

- Customer web app: choose area or device location, delivery or pickup,
  restaurant list with search, cuisine and offer filters, sorting, open and
  closed sections.
- Restaurant page with menu, required and optional option groups, allergens,
  sold-out items, "from" prices, promotion bar.
- Cart with one restaurant at a time, minimum order and best promotion,
  shared pricing logic.
- Checkout as a guest (name, phone, street, note), pay on delivery or pickup.
  The server re-prices the cart and rejects closed restaurants, out-of-area
  addresses and invalid carts.
- Order page with status timeline and ETA, polled every 15 seconds.

## Next

1. **Restaurant panel**: log in, see incoming orders, accept or reject, set
   prep time, move status, mark items sold out. This also drives the
   customer's status timeline.
2. **Customer accounts**: sign-up and login, saved addresses, order history,
   reorder (see `docs/research/07-account.md`).
3. **Address search**: geocoding provider for free-text addresses, delivery
   zones as polygons.
4. **Online payment** (e.g. Stripe or Mollie) with refunds on rejection.
5. **Courier flow**: assignment, pickup, live location (`09-courier.md`).
6. **Rewards**: stamp cards and vouchers (`10-loyalty.md`).
7. **Pre-orders and time slots** for closed restaurants.
8. **i18n**: German and Turkish UI next to English.

## Research still needed

Cart, checkout, order tracking and the item option sheet
(see `docs/research/README.md`).
