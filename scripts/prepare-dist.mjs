import { cp, rm } from "node:fs/promises";

await rm("dist", { force: true, recursive: true });
await cp("out", "dist", { recursive: true });
