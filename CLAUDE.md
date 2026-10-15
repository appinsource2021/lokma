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
- Each finding cites its REA evidence (tool and target), recorded in the
  research note rather than as raw dumps.

## Research notes

One file per flow in `docs/research/` (see its README for the template).
A flow note is the spec that implementation follows.

## Build

Planned stack: TypeScript monorepo with a Next.js web app (customer, restaurant
and admin views), a Node API and PostgreSQL with Prisma. Update this section when
the scaffold lands.
