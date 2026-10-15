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

Early stage. The repository holds the research setup, and the application is
next.

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
