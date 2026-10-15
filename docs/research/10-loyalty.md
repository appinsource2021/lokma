# Rewards: stamp cards

Source: screen recording of the iOS app, 2026-10-15, 00:57–01:14.

## What the user sees

- The Rewards tab lists the reward programmes. Only stamp cards are shown.
- The stamp card screen has three tabs: **your stamp cards**, **how it works**,
  **terms**.
- Each card belongs to **one restaurant**: its logo and name, a row of 5 stamp
  slots (filled or empty) and a progress line ("2 more orders!").
- A restaurant can have several cards at once (a completed or second card
  appears as a separate row).
- An empty state when the user has no cards.

## Rules (inferred, to confirm)

- One stamp per qualifying delivered order at that restaurant.
- After 5 stamps the user receives a voucher for that restaurant.
- Restaurants opt in. Participating restaurants are labelled on cards and pages.

## Data involved

`StampCard { id, userId, restaurantId, stamps, required: 5, completedAt?,
voucherId? }`
`Voucher { id, userId, restaurantId?, amount|percent, minSubtotal?,
expiresAt, redeemedOrderId? }`

## Lokma decision

Phase 2. Model `StampCard` and `Voucher` now so orders can award stamps later.

## Evidence

Screen recording, 00:57–01:14.
