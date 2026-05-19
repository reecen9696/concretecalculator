import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3 py-3"
    >
      <div className="flex items-center gap-2 text-brand">
        <CheckCircle2 size={20} />
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">
          Thanks {firstName} — we've got your details.
        </h2>
      </div>
      <p className="text-[13.5px] text-ink-muted leading-relaxed">
        A member of our team will be in touch within 24 hours. We've also sent
        you an email about alternative payment options.
      </p>

      {status === "failed" && (
        <div className="rounded-control border border-warning/30 bg-warning/[0.06] p-3 mt-2">
          <div className="flex items-start gap-2">
            <AlertCircle
              size={14}
              className="text-warning mt-0.5 flex-none"
            />
            <p className="text-[12px] text-ink-muted leading-snug">
              We couldn't send the confirmation just now, but Luke has been
              notified. If you don't hear back within 24 hours, please get in
              touch directly.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
