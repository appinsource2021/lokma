# Address entry and delivery-area check

Source: screen recording of the iOS app, 2026-10-15, 00:28–00:31. See "Evidence".

## What the user sees

- The current delivery address is always visible at the top of the home screen
  as a tappable title (street and house number with a chevron). Tapping it
  opens a full-height **location sheet**.
- Next to the address there is a **fulfilment toggle** (delivery or pickup), so
  the mode is chosen before browsing rather than at checkout.
- The location sheet contains:
  - a single free-text field for the full address, focused with the keyboard open;
  - a **use current location** row (device geolocation);
  - **recent searches**, with an edit action to remove entries;
  - **saved addresses**, each showing its distance from the current position.
  The list mixes a pinned "current" address with the others.
  - a cancel action to close without changing anything.
- On launch the app may **silently switch** to the nearest saved address and
  show a dismissible toast with an **undo** action.
- After a change, the home feed reloads with skeleton placeholders while it
  searches for partners near the new address.

## Rules and edge cases

- An address can be saved twice with different spellings. The address book
  showed near-duplicates, so the product does not normalise or deduplicate.
- Saved addresses can carry extra free-text lines (company, floor, name).
- Location permission is requested in-app first with an explanation, then by
  the OS. Declining keeps manual entry working.

## Data involved

`Address { id, userId, label?, street, houseNumber, postalCode, city,
country, extraLines[], lat, lng, lastUsedAt }`

## Lokma decision

- Build: header address picker, sheet with search, "use my location", recent
  and saved addresses, distance per saved address.
- Change: geocode and normalise on save, and **deduplicate** by normalised
  street, house number and postal code. Auto-switching to the nearest address
  stays, with an undo toast.
- Delivery-area check: a restaurant serves an address when the address falls
  inside the restaurant's delivery zone (polygon or radius). Fee and minimum
  order can vary by zone.

## Evidence

Screen recording only (REA could not reach the web app: a bot challenge blocks
datacenter traffic). Timestamps 00:06–00:11 (toast and undo) and 00:28–00:31 (sheet).
