/**
 * POST /api/upload-url — Vercel Blob client-direct upload endpoint.
 *
 * The client uses `@vercel/blob/client`'s `upload()` helper, which calls THIS
 * endpoint to mint a short-lived upload token, then PUTs the file straight to
 * Blob storage (bypassing the 4.5 MB Vercel function payload cap).
 *
 * Returns the signed token + a Blob path in the form
 * `inquiries/{yyyy-mm-dd}/{nanoid}-{filename}` so Luke can scan paths by date.
 *
 * Server env var required:
 *   BLOB_READ_WRITE_TOKEN  — auto-injected by Vercel when the project has
 *                            Vercel Blob enabled. See DEPLOYMENT_NOTES.md.
 *
 * Local dev: if the token is missing, this endpoint returns 503 with a clear
 * message rather than silently failing.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — matches originalcalc config
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({
      error:
        "Blob storage not configured. Set BLOB_READ_WRITE_TOKEN in Vercel project env (see DEPLOYMENT_NOTES.md → Blob storage).",
    });
    return;
  }

  // Vercel can pass req.body either as a parsed object or a raw string
  // depending on Content-Type. handleUpload expects the parsed object shape.
  const body =
    typeof req.body === "string"
      ? (JSON.parse(req.body) as HandleUploadBody)
      : (req.body as HandleUploadBody);

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req as unknown as Request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ALLOWED,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ originalPathname: pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Could be used to record uploads to a DB; for v1 the inquiry email
        // carries the URLs and Luke's inbox is the audit trail.
        console.log("Blob uploaded:", blob.url);
      },
    });
    res.status(200).json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("upload-url error:", message);
    res.status(400).json({ error: message });
  }
}
