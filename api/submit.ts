/**
 * POST /api/submit — single Vercel serverless function.
 *
 * Validates the incoming payload, then sends one inquiry email to Luke
 * via Resend.
 *
 * Returns { success: true } or { success: false, error }.
 *
 * Env vars:
 *   RESEND_API_KEY            (server-only; required in production)
 *   INQUIRY_RECIPIENT_EMAIL   (server-only; Luke's address)
 *   SENDER_EMAIL              (server-only; verified sender — see DEPLOYMENT_NOTES.md)
 *
 * Local dev: if RESEND_API_KEY is unset, the function logs the email
 * payload to stdout and returns success — convenient for `vercel dev`
 * walk-throughs without a real key.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { Resend } from "resend";
// NOTE: explicit .js extension is required — package.json has "type":"module"
// and Vercel runs each api/*.ts as an unbundled ESM module, so Node's ESM
// resolver needs the extension (it maps back to emails.ts at build time).
import { buildLukeInquiryEmail } from "./emails.js";

// =============================================================================
// Payload validation (mirrors src/types/form.ts → SubmissionPayload)
// =============================================================================

const customerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(60),
  email: z.string().email().max(200),
  suburb: z.string().min(1).max(200),
});

const projectSchema = z.object({
  areaSqm: z.number().nonnegative(),
  areaMethod: z.enum(["total", "sections", "plans"]),
  areaSections: z
    .array(z.object({ length: z.number(), width: z.number() }))
    .optional(),
  finish: z.enum([
    "natural_grey",
    "coloured",
    "exposed_aggregate",
    "pavilion_finish",
  ]),
  hasRemoval: z.boolean(),
  slope: z.enum(["flat_minimal", "moderately_steep", "extremely_steep"]),
  drainage: z.enum(["no", "yes", "unsure"]),
  stripDrainLengthM: z.number().optional(),
});

const uploadedFileSchema = z.object({
  url: z.string().url(),
  filename: z.string().max(255),
  contentType: z.string().max(100),
  size: z.number().nonnegative(),
});

const estimateSchema = z
  .object({
    finalIncGst: z.number(),
    financeAdjustedExGst: z.number(),
    gstAmount: z.number(),
    originalSubtotal: z.number(),
    optimizationOccurred: z.boolean(),
    discountApplied: z.number(),
    originalBracket: z.object({
      from: z.number(),
      to: z.number(),
      fortnights: z.number(),
      feePercent: z.number(),
      rangeDesc: z.string(),
    }),
    optimizedBracket: z.object({
      from: z.number(),
      to: z.number(),
      fortnights: z.number(),
      feePercent: z.number(),
      rangeDesc: z.string(),
    }),
    repayment: z.object({
      termWeeks: z.number(),
      fortnights: z.number(),
      fortnightly: z.number(),
      weekly: z.number(),
    }),
    lineItems: z.array(
      z.object({ description: z.string(), amount: z.number() }),
    ),
    reviewFlags: z.array(z.string()),
    optimizationDetails: z
      .object({
        reason: z.string(),
        feeSavings: z.number(),
        discountAmount: z.number(),
        netBenefit: z.number(),
      })
      .nullable(),
  })
  .partial({ optimizationDetails: true });

const payloadSchema = z.object({
  customer: customerSchema,
  project: projectSchema,
  plans: z.array(uploadedFileSchema).optional().default([]),
  photos: z.array(uploadedFileSchema).optional().default([]),
  estimate: estimateSchema.optional(),
});

export type ValidatedPayload = z.infer<typeof payloadSchema>;

// =============================================================================
// Handler
// =============================================================================

const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev";
const INQUIRY_RECIPIENT =
  process.env.INQUIRY_RECIPIENT_EMAIL || "luke@smoothconcrete.com.au";
// Additional recipients CC'd on every inquiry (comma-separated env override,
// otherwise the Uprise Digital contact by default).
const CC_RECIPIENTS = (
  process.env.INQUIRY_CC_EMAILS || "thejana@uprisedigital.com.au"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method Not Allowed" });
    return;
  }

  // Vercel auto-parses JSON; defensive in case `Content-Type` is missing.
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

  const payload = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;

  try {
    await sendEmail(apiKey, {
      from: SENDER_EMAIL,
      to: INQUIRY_RECIPIENT,
      cc: CC_RECIPIENTS,
      replyTo: payload.customer.email,
      subject: buildEligibleSubject(payload),
      html: buildLukeInquiryEmail(payload),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Email send failed:", message);
    res.status(500).json({ success: false, error: message });
  }
}

// =============================================================================
// Helpers
// =============================================================================

interface EmailArgs {
  from: string;
  to: string;
  cc?: string[];
  replyTo?: string;
  subject: string;
  html: string;
}

async function sendEmail(apiKey: string | undefined, args: EmailArgs) {
  if (!apiKey) {
    // Local dev stub. No key → log and pretend it worked.
    console.log("[/api/submit] (no RESEND_API_KEY — stub mode)");
    console.log("  to:", args.to);
    if (args.cc?.length) console.log("  cc:", args.cc.join(", "));
    console.log("  subject:", args.subject);
    return;
  }
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: args.from,
    to: [args.to],
    cc: args.cc?.length ? args.cc : undefined,
    replyTo: args.replyTo,
    subject: args.subject,
    html: args.html,
  });
  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }
}

function buildEligibleSubject(p: ValidatedPayload): string {
  const name = p.customer.name;
  if (!p.estimate) {
    return `Driveway Inquiry (measurements pending) — ${name}`;
  }
  const price = currency(p.estimate.finalIncGst);
  return `Driveway Estimate — ${name} — ${price}`;
}

function currency(n: number): string {
  return `$${n.toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
