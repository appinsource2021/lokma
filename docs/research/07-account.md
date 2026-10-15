# Account and order history

Source: screen recording of the iOS app, 2026-10-15, 00:41–00:56 and 01:14–01:46.

## Orders tab

- Shows a loading state, then an info note that the star ratings shown are the
  user's own ratings of each restaurant.
- Order overview, newest first. Each row has the restaurant logo and name, the
  status and date ("delivered · 12/10/2026"), a "view order" link, item count
  and total, and two actions: **rate** (only while rating is still possible)
  and **order again**.
- **Order again** opens the restaurant and tries to rebuild the cart. If that
  fails (the recorded case: the restaurant was closed), a modal says the cart
  could not be restored and offers "view order history" or "search nearby".

## Account tab

- Greeting with the user's first name and an avatar initial.
- Help or support entry.
- **Your account**: personal data (first and last name editable, email
  read-only, explicit "save changes" action) and delivery addresses (address
  book with an edit mode).
- **Settings**: country (list of supported countries; one entry opens an
  external site), location services (in-app explanation, then the OS settings),
  language (sends the user to the OS per-app language setting), notifications
  (one marketing opt-in toggle), cookie settings.
- Feedback entry.
- **Useful links**: legal and privacy, sign up as a courier, business orders,
  become a partner restaurant.
- Log out, close account, app version string.

## Data involved

`User { id, firstName, lastName, email, phone?, country, locale,
marketingOptIn }`
`Order { id, userId, restaurantId, status, placedAt, deliveredAt?,
itemCount, total, rating? }`

## Lokma decision

- Build: orders list with reorder and rate; reorder rebuilds the cart from
  current menu prices, drops unavailable items and tells the user what changed,
  and blocks with a clear message when the restaurant is closed (with an option
  to pre-order).
- Account: profile, address book, language in-app (web), notification opt-in,
  legal links, log out, delete account (GDPR).
- Courier and partner sign-up links point to Lokma's own restaurant and
  courier apps later.

## Evidence

Screen recording, 00:41–00:56 and 01:14–01:46.
