import { useEffect, useMemo, useRef, useState } from "react";
import { computeAreaSqm, useFormStore } from "@/state/useFormStore";
import { calculateEstimate, type Drainage } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import { submitInquiry } from "@/lib/submit";
import type { SubmissionPayload } from "@/types/form";

export function EstimateStep() {
  const state = useFormStore();
  const [status, setStatus] = useState<"sending" | "sent" | "error">("sending");
  const [error, setError] = useState<string | null>(null);
  const sentRef = useRef(false);

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
    customer: state.customer,
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

  const submit = async () => {
    setStatus("sending");
    setError(null);
    const result = await submitInquiry(buildPayload());
    if (result.success) {
      setStatus("sent");
    } else {
      setError(result.error || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  // Send the inquiry automatically once the customer reaches the estimate —
  // there's no longer a "submit" button. The ref guards against the effect
  // firing twice (React StrictMode in dev).
  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="weekly tnum">
          {formatCurrency(estimate.repayment.weekly)}/week
        </div>
        <div className="repay-sub tnum">
          {formatCurrency(estimate.repayment.fortnightly)}/fortnight ·{" "}
          {estimate.repayment.fortnights} fortnights
        </div>
      </div>

      <div className={`estimate-status estimate-status--${status}`}>
        {status === "sending" && "Sending your details…"}
        {status === "sent" && (
          <>
            Thanks! We've received your details and will be in contact shortly
            about the next steps for your driveway.
          </>
        )}
        {status === "error" && (
          <>
            <div>We couldn't send your details: {error}</div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 10 }}
              onClick={submit}
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
