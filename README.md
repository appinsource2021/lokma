# Lokma

Lokma is an open-source food delivery platform: find restaurants that deliver
to your address, browse menus, build a cart, check out and follow your order
until it arrives.

The product flow is modelled on the large delivery platforms in the German
market (for example Lieferando). We study how those services behave from the
outside, write the findings down in our own words, and then build Lokma from
scratch. Lokma contains no code, branding, images, text or private APIs from any
other service.

## Status

The first working slice is in place: browse restaurants near an address,
build a cart with options and promotions, check out as a guest and follow the
order status. See [`docs/roadmap.md`](docs/roadmap.md) for what comes next.

## Run it locally

Requirements: Node 22, pnpm 10, PostgreSQL 16.

```bash
cp .env.example .env
pnpm install
pnpm db:setup     # Debian/Ubuntu: starts PostgreSQL and creates the lokma database
pnpm db:migrate
pnpm db:seed      # invented demo restaurants around Mannheim
pnpm dev          # API on http://localhost:4000, web on http://localhost:3000
```

Open http://localhost:3000, pick a Mannheim area and order. Restaurants follow
their opening hours in Europe/Berlin time; one demo restaurant stays open
until 03:00.

```bash
pnpm typecheck
pnpm test         # API tests need DATABASE_URL
```

## Project layout

- `packages/core`: pricing, option rules, promotions, delivery zones and
  opening hours, shared by the API and the web app.
- `apps/api`: Fastify + Prisma + PostgreSQL REST API.
- `apps/web`: Next.js customer web app.
- `docs/research`: flow notes that the implementation follows.

## How the work is done

- **REA** ([morluto/rea](https://github.com/morluto/rea)) is used to understand
  how existing delivery apps behave. It runs as a project MCP server
  (`.mcp.json`).
- Findings go to [`docs/research/`](docs/research/README.md) as flow
  descriptions in our own words.
- **Claude Code** implements Lokma from those descriptions.

See [`CLAUDE.md`](CLAUDE.md) for the working rules.

## License

[MIT](LICENSE). Third-party notices are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
