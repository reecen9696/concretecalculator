/**
 * Client-side wrapper around POST /api/submit.
 *
 * The serverless function does the email sending (Resend). This wrapper just
 * builds the typed payload and forwards it.
 */

import type { SubmissionPayload } from "@/types/form";

export interface SubmitSuccess {
  success: true;
}
export interface SubmitFailure {
  success: false;
  error: string;
}
export type SubmitResult = SubmitSuccess | SubmitFailure;

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
