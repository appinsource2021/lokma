# Lokma — working rules

Lokma is an open-source food delivery platform whose product flows are modelled on
Lieferando. The work has two phases: **understand** existing services with REA,
then **build** Lokma with original code.

## Clean-room rule (non-negotiable)

- Use REA only to understand *behaviour*: screens, steps, states, validation,
  edge cases and data shapes at a conceptual level.
- Never copy another service's source code, decompiled code, CSS, images, logos,
  icons, fonts, copy text, brand names or colours into this repository.
- Never call another service's private or internal APIs from Lokma code, tests or
  seed data. Do not scrape their restaurant or menu data. Seed data is invented.
- Raw artifacts (downloaded bundles, APKs, captures, REA snapshots) stay outside
  the repo or in the git-ignored `research-artifacts/`. Only our own written
  summaries are committed.

## REA

- The REA MCP server is registered in `.mcp.json` (`rea-agents`, pinned version).
  Usage guidance is in `.claude/skills/reverse-engineer-anything/SKILL.md`.
- For a website or web app, the JavaScript/browser tools need no extra engine.
  Android APKs need JADX (`REA_JADX_MCP_JAR`), and native binaries need Ghidra or
  Hopper.
- Each finding cites its evidence: the REA tool and target, or a screen
  recording with timestamps. Record it in the research note, not as raw dumps.
- Screen recordings may contain personal data. Never copy names, emails,
  addresses or order details from them into notes.

## Research notes

One file per flow in `docs/research/` (see its README for the template).
A flow note is the spec that implementation follows.

## Build

pnpm monorepo, Node 22, TypeScript everywhere.

| Package | What | Stack |
|---|---|---|
| `packages/core` | Pricing, option validation, promotions, delivery zones, opening hours, distance. Pure functions shared by API and web. | TypeScript, Vitest |
| `apps/api` | REST API on port 4000 | Fastify 5, Zod, Prisma 6, PostgreSQL 16 |
| `apps/web` | Customer web app on port 3000 | Next.js 15 (App Router), React 19, plain CSS |

Commands (from the repo root):

```bash
cp .env.example .env      # once
pnpm install
pnpm db:setup             # start local PostgreSQL, create role and database
pnpm db:migrate           # apply migrations
pnpm db:seed              # invented demo restaurants around Mannheim
pnpm dev                  # API :4000 and web :3000
pnpm typecheck && pnpm test
```

Rules:

- Money is integer euro cents. Format only at the edge (`formatEuro`).
- The server is the source of truth for prices: `POST /orders` re-prices the
  cart with `priceCart` and ignores client totals. The web app uses the same
  function for instant feedback.
- Times and opening hours use `Europe/Berlin`.
- Every schema change gets a Prisma migration (`pnpm --filter @lokma/api db:migrate:new <name>`).
- Seed data is invented. Never copy real restaurants, menus or prices.
- Status of each flow lives in `docs/research/README.md` and `docs/roadmap.md`.
