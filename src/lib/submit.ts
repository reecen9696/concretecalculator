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
    const data = (await res.json()) as SubmitResult;
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: "error" in data ? data.error : `HTTP ${res.status}`,
      };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
