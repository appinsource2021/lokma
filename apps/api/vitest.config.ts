import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests need DATABASE_URL; load it from the repo root .env when present.
    env: { ...process.env },
    setupFiles: ["./test/setup.ts"],
  },
});
