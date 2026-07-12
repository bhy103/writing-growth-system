import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { force: true, recursive: true });
await mkdir("dist/server", { recursive: true });
await cp("out", "dist/public", { recursive: true });
await cp(".openai", "dist/.openai", { recursive: true });

await writeFile(
  "dist/server/index.js",
  `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) {
      return response;
    }

    const url = new URL(request.url);
    if (!url.pathname.includes(".")) {
      url.pathname = "/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }

    return response;
  },
};
`,
);
