import { useMemo, useState } from "react";
import { computeAreaSqm, useFormStore } from "@/state/useFormStore";
import { calculateEstimate, type Drainage } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import { submitInquiry } from "@/lib/submit";
import type { SubmissionPayload } from "@/types/form";

const HUM_PORTAL_URL =
  import.meta.env.VITE_HUM_PORTAL_URL ?? "https://hum.com.au";

export function EstimateStep() {
  const state = useFormStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const areaSqm = useMemo(() => computeAreaSqm(state), [state]);
  const isViaEmail = state.area.method === "via_email";

  // All required inputs guaranteed by step validation before reaching here.
  const estimate = useMemo(() => {
    if (isViaEmail) return null;
    if (!state.finish || state.hasRemoval === undefined || !state.slope) {
      return null;
    }
    return calculateEstimate({
      areaSqm,
      finish: state.finish,
      hasRemoval: state.hasRemoval,
      slope: state.slope,
      drainage: (state.drainage.answer ?? "no") as Drainage,
      stripDrainLengthM:
        state.drainage.answer === "yes" &&
        typeof state.drainage.lengthM === "number"
          ? state.drainage.lengthM
          : undefined,
    });
  }, [areaSqm, isViaEmail, state]);

  const buildPayload = (): SubmissionPayload => ({
    outcome: "eligible",
    customer: state.customer,
    eligibility: state.eligibility,
    project: state.finish &&
      state.hasRemoval !== undefined &&
      state.slope &&
      state.drainage.answer
        ? {
            areaSqm,
            areaMethod: state.area.method!,
            areaSections:
              state.area.method === "sections"
                ? state.area.sections
                    .filter(
                      (s) => Number(s.length) > 0 && Number(s.width) > 0,
                    )
                    .map((s) => ({
                      length: Number(s.length),
                      width: Number(s.width),
                    }))
                : undefined,
            emailNote:
              state.area.method === "via_email"
                ? state.area.emailNote.trim() || undefined
                : undefined,
            finish: state.finish,
            hasRemoval: state.hasRemoval,
            slope: state.slope,
            drainage: state.drainage.answer,
            stripDrainLengthM:
              state.drainage.answer === "yes" &&
              typeof state.drainage.lengthM === "number"
                ? state.drainage.lengthM
                : undefined,
          }
        : undefined,
    estimate: estimate ?? undefined,
  });

  const handleProceed = async () => {
    setSubmitting(true);
    setError(null);
    const result = await submitInquiry(buildPayload());
    if (!result.success) {
      setError(result.error || "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    if (!isViaEmail) {
      window.location.href = HUM_PORTAL_URL;
      return; // intentional: leave button spinner up during navigation
    }
    setSubmitting(false);
    // Stay on screen — render success state below.
    setSent(true);
  };

  const [sent, setSent] = useState(false);

  // -- via_email branch: no price, send-to-Luke CTA only --------------------
  if (isViaEmail) {
    if (sent) {
      return (
        <div>
          <h2>Thanks {state.customer.name.split(" ")[0] || "there"} — inquiry sent.</h2>
          <p>
            We've sent your details to the Smooth Concrete team. Reply to the
            email we'll send you with your driveway measurements (length,
            width, anything notable about the site) and we'll come back with a
            precise quote within 24 hours.
          </p>
        </div>
      );
    }
    return (
      <div>
        <h2>Almost there — we need your measurements</h2>
        <p>
          You've passed the HUM Finance pre-check. To give you an accurate
          quote we need your driveway dimensions. Send your inquiry now and
          we'll reply by email with a short measurement guide.
        </p>
        {error && <p data-error>{error}</p>}
        <button type="button" onClick={handleProceed} disabled={submitting}>
          {submitting ? "Sending…" : "Send inquiry to Smooth Concrete"}
        </button>
      </div>
    );
  }

  // -- Eligible + numeric area: full estimate display ------------------------
  if (!estimate) {
    return <p>Calculating…</p>;
  }

  return (
    <div>
      <h2>Your estimate</h2>
      <div>
        <small>Estimated project investment</small>
        <div className="tnum" style={{ fontSize: "32px", fontWeight: 700 }}>
          {formatCurrency(estimate.finalIncGst)}
        </div>
        <small>Subject to site review and final approval</small>
      </div>

      <div>
        <h3>Repayment options · HUM Finance</h3>
        <p>
          From <strong className="tnum">{formatCurrency(estimate.repayment.weekly)}</strong>{" "}
          /week
        </p>
        <p>
          Over {estimate.repayment.fortnights} fortnights (
          {estimate.repayment.termWeeks} weeks)
          <br />
          <span className="tnum">
            {formatCurrency(estimate.repayment.fortnightly)}
          </span>{" "}
          per fortnight
        </p>
      </div>

      {estimate.reviewFlags.length > 0 && (
        <div>
          <h4>Notes</h4>
          <ul>
            {estimate.reviewFlags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {error && <p data-error>{error}</p>}
      <button type="button" onClick={handleProceed} disabled={submitting}>
        {submitting ? "Sending…" : "Continue to HUM Finance →"}
      </button>
    </div>
  );
}
