# Research notes

Each note describes one user flow **in our own words**. Notes must not contain
copied code, text, images or API details from the service that was studied.

## Flows to cover

| # | Flow | Note |
|---|------|------|
| 1 | Address entry and delivery-area check | `01-address.md` |
| 2 | Restaurant list: filters, sorting, open/closed, delivery fee, minimum order | `02-restaurant-list.md` |
| 3 | Restaurant page and menu: categories, item options and extras, allergens | `03-menu.md` |
| 4 | Cart: minimum order, delivery fee, multiple restaurants | `04-cart.md` |
| 5 | Checkout: delivery or pickup, time slots, tip, payment methods, vouchers | `05-checkout.md` |
| 6 | Order status and tracking | `06-order-tracking.md` |
| 7 | Account: addresses, order history, reorder, ratings | `07-account.md` |
| 8 | Restaurant side: accepting orders, prep time, menu management | `08-restaurant-panel.md` |
| 9 | Courier side: assignment, pickup, delivery | `09-courier.md` |

## Template

```markdown
# <Flow name>

## What the user sees
Steps and states, described in our own words.

## Rules and edge cases
Validation, limits, error states.

## Data involved
Conceptual entities and fields (our own naming).

## Evidence
REA tool, target and date for each claim, without raw dumps.

## Lokma decision
What we build, what we change and what we leave out.
```
