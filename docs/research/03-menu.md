# Restaurant page and menu

Source: screen recording of the iOS app, 2026-10-15, 00:46–00:52 (partial).
The recording only reached the top of a restaurant page, and that restaurant
was closed.

## What the user sees

- Top bar: back, an open/closed status pill, search within the menu.
- Hero image with the logo and a **group order** button.
- Name, favourite toggle, an "about" link, rating with review count, and the
  minimum order ("no minimum order" is shown explicitly).
- A highlighted promo bar for the restaurant's current discount (tappable).
- A stamp-card row with a "learn more" link.
- Sections: **order again** (items the user bought before), **current offers**,
  then the menu categories.
- Item tile: name, short description (e.g. size and deposit for drinks), price
  shown as "from X" when options change the price, the original price struck
  through when discounted, a discount badge, a thumbnail and a quick **+** add
  button.

## Still unknown (needs another recording)

- Item detail sheet: required and optional option groups, min and max choices,
  extras pricing, notes, quantity.
- Allergen and additive information.
- How the cart is shown on this page.

## Data involved

`MenuCategory { id, restaurantId, name, sort }`
`MenuItem { id, categoryId, name, description, basePrice, image?, tags[],
allergens[], available }`
`OptionGroup { id, itemId, name, minSelect, maxSelect }`
`Option { id, groupId, name, priceDelta }`

## Lokma decision

Build the page as described. Show the "from" price when any required option
group changes the price. The group order feature is phase 2.

## Evidence

Screen recording, 00:46–00:52.
