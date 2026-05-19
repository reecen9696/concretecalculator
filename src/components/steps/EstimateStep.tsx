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

  const estimate = useMemo(() => {
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
  }, [areaSqm, state]);

  const buildPayload = (): SubmissionPayload => ({
    outcome: "eligible",
    customer: state.customer,
    eligibility: state.eligibility,
    project:
      state.finish && state.hasRemoval !== undefined && state.slope &&
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
    plans: state.plans,
    photos: state.photos,
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
    window.location.href = HUM_PORTAL_URL;
  };

  if (!estimate) {
    return <div className="form-section">Calculating…</div>;
  }

  return (
    <div className="form-section">
      <h2>Your Estimate</h2>

      <div className="estimate-amount">
        <div className="label">Estimated Project Investment</div>
        <div className="value tnum">{formatCurrency(estimate.finalIncGst)}</div>
        <div className="fine">Subject to site review and final approval.</div>
      </div>

      <div className="repayment-box">
        <h3>Repayment Options · HUM Finance</h3>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Pay over {estimate.repayment.fortnights} fortnights (
            {estimate.repayment.termWeeks} weeks)
          </div>
          <div className="weekly tnum">
            {formatCurrency(estimate.repayment.weekly)}/week
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginTop: 6,
            }}
          >
            <span className="tnum">
              {formatCurrency(estimate.repayment.fortnightly)}
            </span>{" "}
            per fortnight
          </div>
        </div>
      </div>

      {estimate.reviewFlags.length > 0 && (
        <div className="review-flags">
          <h4>Important Notes</h4>
          <ul>
            {estimate.reviewFlags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Submission error:</strong> {error}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleProceed}
        disabled={submitting}
        style={{ width: "100%", marginTop: 20 }}
      >
        {submitting ? "Sending…" : "Continue to HUM Finance →"}
      </button>
    </div>
  );
}
