import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "prisma/config";

function readLocalEnv(name: string) {
  const localEnvPath = join(process.cwd(), ".env.local");

  if (!existsSync(localEnvPath)) {
    return undefined;
  }

  const line = readFileSync(localEnvPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`));

  return line?.slice(name.length + 1).replace(/^"|"$/g, "");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? readLocalEnv("DATABASE_URL"),
  },
});
