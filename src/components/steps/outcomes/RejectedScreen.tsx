import { useEffect, useRef, useState } from "react";
import { useFormStore } from "@/state/useFormStore";
import { evaluateEligibility } from "@/lib/eligibility";
import { submitInquiry } from "@/lib/submit";
import type { SubmissionPayload } from "@/types/form";

/**
 * Rejection thank-you screen. Fires the rejected submission once on mount
 * (idempotent via a guard ref so React 18 StrictMode double-mount doesn't
 * double-send).
 */
export function RejectedScreen() {
  const state = useFormStore();
  const firedRef = useRef(false);
  const [status, setStatus] = useState<"sending" | "sent" | "failed">(
    "sending",
  );

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const failedCriteria = evaluateEligibility(
      state.eligibility,
    ).failedCriteria;
    const payload: SubmissionPayload = {
      outcome: "rejected",
      customer: state.customer,
      eligibility: state.eligibility,
      failedCriteria,
    };

    submitInquiry(payload).then((res) => {
      setStatus(res.success ? "sent" : "failed");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = state.customer.name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="form-section" style={{ paddingTop: 20 }}>
      <h2>Thanks {firstName} — we've got your details.</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
        A member of our team will be in touch within 24 hours. We've also sent
        you an email about alternative payment options.
      </p>

      {status === "failed" && (
        <div className="error-message" style={{ marginTop: 20 }}>
          <strong>Heads-up:</strong> we couldn't send the confirmation just
          now, but Luke has been notified. If you don't hear back within 24
          hours, please get in touch directly.
        </div>
      )}
    </div>
  );
}
