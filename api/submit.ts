/**
 * POST /api/submit — single Vercel serverless function.
 *
 * Validates the incoming payload, then sends emails via Resend:
 *
 *   outcome = "eligible"  → one inquiry email to Luke
 *   outcome = "rejected"  → one rejection-handover email to Luke
 *                          + one rejection-explanation email to the customer
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
import {
  buildLukeInquiryEmail,
  buildLukeRejectionEmail,
  buildCustomerRejectionEmail,
} from "./emails";

// =============================================================================
// Payload validation (mirrors src/types/form.ts → SubmissionPayload)
// =============================================================================

const customerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(60),
  email: z.string().email().max(200),
  suburb: z.string().min(1).max(200),
});

const eligibilitySchema = z.object({
  residency: z.enum(["yes", "no"]).optional(),
  income: z.enum(["<30k", "30-60k", "60-100k", "100k+"]).optional(),
  employment: z
    .enum(["full_time", "part_time", "casual", "self_employed", "unemployed"])
    .optional(),
  bankruptcy: z.enum(["yes", "no"]).optional(),
});

const projectSchema = z.object({
  areaSqm: z.number().nonnegative(),
  areaMethod: z.enum(["total", "sections", "via_email"]),
  areaSections: z
    .array(z.object({ length: z.number(), width: z.number() }))
    .optional(),
  emailNote: z.string().max(500).optional(),
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

const payloadSchema = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("eligible"),
    customer: customerSchema,
    eligibility: eligibilitySchema,
    project: projectSchema,
    estimate: estimateSchema.optional(), // absent for via_email path
  }),
  z.object({
    outcome: z.literal("rejected"),
    customer: customerSchema,
    eligibility: eligibilitySchema,
    failedCriteria: z.array(z.string()),
  }),
]);

export type ValidatedPayload = z.infer<typeof payloadSchema>;

// =============================================================================
// Handler
// =============================================================================

const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev";
const INQUIRY_RECIPIENT =
  process.env.INQUIRY_RECIPIENT_EMAIL || "lukeshah100@gmail.com";

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
    if (payload.outcome === "eligible") {
      await sendEmail(apiKey, {
        from: SENDER_EMAIL,
        to: INQUIRY_RECIPIENT,
        replyTo: payload.customer.email,
        subject: buildEligibleSubject(payload),
        html: buildLukeInquiryEmail(payload),
      });
    } else {
      // Rejected: two emails.
      await Promise.all([
        sendEmail(apiKey, {
          from: SENDER_EMAIL,
          to: INQUIRY_RECIPIENT,
          replyTo: payload.customer.email,
          subject: `REJECTED inquiry — ${payload.customer.name}, manual follow-up`,
          html: buildLukeRejectionEmail(payload),
        }),
        sendEmail(apiKey, {
          from: SENDER_EMAIL,
          to: payload.customer.email,
          replyTo: INQUIRY_RECIPIENT,
          subject: "About your driveway enquiry — Smooth Concrete",
          html: buildCustomerRejectionEmail(payload),
        }),
      ]);
    }

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
  replyTo?: string;
  subject: string;
  html: string;
}

async function sendEmail(apiKey: string | undefined, args: EmailArgs) {
  if (!apiKey) {
    // Local dev stub. No key → log and pretend it worked.
    console.log("[/api/submit] (no RESEND_API_KEY — stub mode)");
    console.log("  to:", args.to);
    console.log("  subject:", args.subject);
    return;
  }
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: args.from,
    to: [args.to],
    replyTo: args.replyTo,
    subject: args.subject,
    html: args.html,
  });
  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }
}

function buildEligibleSubject(p: ValidatedPayload): string {
  if (p.outcome !== "eligible") return "Driveway Inquiry";
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
