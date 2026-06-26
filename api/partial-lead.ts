/**
 * POST /api/partial-lead — fires when the customer completes the first page
 * (contact details) and clicks Next. Sends an "incomplete lead" alert to the
 * same recipients as the final inquiry (Luke + CC) so the team can follow up
 * if the customer drops off before finishing the quote.
 *
 * A full estimate email still follows from /api/submit if they complete.
 *
 * Returns { success: true } or { success: false, error }.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
// Explicit .js extension — see note in submit.ts (ESM under "type":"module").
import { buildPartialLeadEmail } from "./emails.js";
import {
  SENDER_EMAIL,
  INQUIRY_RECIPIENT,
  CC_RECIPIENTS,
  sendEmail,
} from "./mailer.js";

const payloadSchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(200),
    phone: z.string().min(1).max(60),
    email: z.string().email().max(200),
    suburb: z.string().min(1).max(200),
  }),
  sourceUrl: z.string().max(500).optional(),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method Not Allowed" });
    return;
  }

  let body: unknown = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ success: false, error: "Invalid JSON" });
      return;
    }
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: `Validation failed: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    });
    return;
  }

  const { customer, sourceUrl } = parsed.data;

  try {
    await sendEmail(process.env.RESEND_API_KEY, {
      from: SENDER_EMAIL,
      to: INQUIRY_RECIPIENT,
      cc: CC_RECIPIENTS,
      replyTo: customer.email,
      subject: `New Lead (incomplete) — ${customer.name}`,
      html: buildPartialLeadEmail(customer, sourceUrl),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Partial-lead email send failed:", message);
    res.status(500).json({ success: false, error: message });
  }
}
