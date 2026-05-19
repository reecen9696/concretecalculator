import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Dev-only middleware that runs api/submit.ts inside the Vite dev server.
 * In production this file is irrelevant — Vercel hosts /api/submit as a
 * proper serverless function. Here it just lets us hit the same URL in dev
 * without needing `vercel dev` + Vercel auth.
 */
function apiSubmitMiddleware(): Plugin {
  return {
    name: "smooth-concrete-api-submit-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/submit")) return next();
        try {
          const bodyText = await readBody(req);
          const body = bodyText ? JSON.parse(bodyText) : null;
          const handler = (await server.ssrLoadModule("./api/submit.ts"))
            .default;
          await handler(
            mockVercelReq(req, body),
            mockVercelRes(res),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ success: false, error: msg }));
        }
      });
    },
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function mockVercelReq(req: IncomingMessage, body: unknown) {
  return {
    method: req.method,
    headers: req.headers,
    body,
    query: {},
    cookies: {},
  } as unknown as Parameters<typeof import("./api/submit").default>[0];
}

function mockVercelRes(res: ServerResponse) {
  return {
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
      return this;
    },
    send(payload: string) {
      res.end(payload);
      return this;
    },
  } as unknown as Parameters<typeof import("./api/submit").default>[1];
}

export default defineConfig({
  plugins: [react(), apiSubmitMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
});
