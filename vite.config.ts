import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Dev-only middleware that runs api/*.ts handlers inside the Vite dev server.
 * In production this file is irrelevant — Vercel hosts each api/*.ts as a
 * proper serverless function. Here it just lets us hit the same URLs in dev
 * without needing `vercel dev` + Vercel auth.
 *
 * Add new endpoints by adding an entry to the routes map below.
 */
function apiMiddleware(): Plugin {
  const routes: Record<string, string> = {
    "/api/submit": "./api/submit.ts",
    "/api/upload-url": "./api/upload-url.ts",
  };

  return {
    name: "smooth-concrete-api-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        const match = Object.entries(routes).find(([path]) =>
          url.startsWith(path),
        );
        if (!match) return next();
        const [, modulePath] = match;
        try {
          const bodyText = await readBody(req);
          let body: unknown = null;
          if (bodyText) {
            try {
              body = JSON.parse(bodyText);
            } catch {
              body = bodyText; // hand the raw text to the handler
            }
          }
          const mod = await server.ssrLoadModule(modulePath);
          const handler = mod.default;
          await handler(mockVercelReq(req, body), mockVercelRes(res));
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
  plugins: [react(), apiMiddleware()],
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
