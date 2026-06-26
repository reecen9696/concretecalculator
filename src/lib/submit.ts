/**
 * Client-side wrapper around POST /api/submit.
 *
 * The serverless function does the email sending (Resend). This wrapper just
 * builds the typed payload and forwards it.
 */

import type { CustomerDetails, SubmissionPayload } from "@/types/form";

export interface SubmitSuccess {
  success: true;
}
export interface SubmitFailure {
  success: false;
  error: string;
}
export type SubmitResult = SubmitSuccess | SubmitFailure;

/**
 * Fire-and-forget "incomplete lead" alert, sent once the customer completes
 * the first page (contact details). Guarded so it only fires once per page
 * load — going back/forward through the form won't re-send. `keepalive` lets
 * the request finish even if the user navigates away (the drop-off case).
 */
let partialLeadSent = false;
export function submitPartialLead(customer: CustomerDetails): void {
  if (partialLeadSent) return;
  partialLeadSent = true;
  void fetch("/api/partial-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer,
      sourceUrl:
        typeof window !== "undefined" ? window.location.href : undefined,
    }),
    keepalive: true,
  }).catch(() => {
    // Allow a later retry if this best-effort send failed.
    partialLeadSent = false;
  });
}

export async function submitInquiry(
  payload: SubmissionPayload,
): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // Read as text first — a platform-level failure (e.g. a crashed function)
    // returns an HTML/plain error page, not JSON, which would otherwise throw
    // a cryptic "Unexpected token" when parsed.
    const raw = await res.text();
    let data: { success?: boolean; error?: string } = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      return {
        success: false,
        error: `Server error (HTTP ${res.status}). Please try again in a moment.`,
      };
    }
    if (!res.ok || !data.success) {
      return { success: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
