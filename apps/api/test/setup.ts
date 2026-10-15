import { existsSync } from "node:fs";
import { resolve } from "node:path";

const rootEnv = resolve(import.meta.dirname, "../../../.env");
if (!process.env.DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv);
