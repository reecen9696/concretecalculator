import { useEffect, useState } from "react";
import { useFormStore, validateStep, STEP_ORDER } from "@/state/useFormStore";
import { Shell } from "@/components/Shell";
import { ProgressBar } from "@/components/ProgressBar";
import { CustomerDetailsStep } from "@/components/steps/CustomerDetailsStep";
import { EligibilityStep } from "@/components/steps/EligibilityStep";
import { AreaStep } from "@/components/steps/AreaStep";
import { FinishStep } from "@/components/steps/FinishStep";
import { RemovalStep } from "@/components/steps/RemovalStep";
import { SlopeStep } from "@/components/steps/SlopeStep";
import { DrainageStep } from "@/components/steps/DrainageStep";
import { PhotosStep } from "@/components/steps/PhotosStep";
import { EstimateStep } from "@/components/steps/EstimateStep";
import { RejectedScreen } from "@/components/steps/outcomes/RejectedScreen";

export default function App() {
  const state = useFormStore();
  const [errors, setErrors] = useState<string[]>([]);

  // Clear errors + scroll to top whenever the step changes.
  useEffect(() => {
    setErrors([]);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [state.step]);

  const handleNext = () => {
    const v = validateStep(state);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors([]);
    state.next();
  };
  const handleBack = () => {
    setErrors([]);
    state.back();
  };

  const isRejected = state.step === "rejected";
  const isEstimate = state.step === "estimate";

  return (
    <Shell>
      {!isRejected && <ProgressBar />}

      {errors.length > 0 && (
        <div className="error-message">
          <strong>Please fix the following:</strong>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <StepView />

      {/* Navigation rows */}
      {!isRejected && !isEstimate && (
        <div className="btn-row">
          {state.step !== "customer" ? (
            <button type="button" className="btn btn-secondary" onClick={handleBack}>
              ← Back
            </button>
          ) : (
            <span style={{ flex: 1 }} />
          )}
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {state.step === "photos" ? "See estimate →" : "Next →"}
          </button>
        </div>
      )}

      {isEstimate && (
        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={handleBack}>
            ← Back
          </button>
        </div>
      )}

      {isRejected && (
        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={handleBack}>
            ← Revise answers
          </button>
        </div>
      )}
    </Shell>
  );
}

function StepView() {
  const step = useFormStore((s) => s.step);
  // Key on step so the CSS fadeIn animation re-fires on each transition.
  switch (step) {
    case "customer":
      return <CustomerDetailsStep key={step} />;
    case "eligibility":
      return <EligibilityStep key={step} />;
    case "area":
      return <AreaStep key={step} />;
    case "finish":
      return <FinishStep key={step} />;
    case "removal":
      return <RemovalStep key={step} />;
    case "slope":
      return <SlopeStep key={step} />;
    case "drainage":
      return <DrainageStep key={step} />;
    case "photos":
      return <PhotosStep key={step} />;
    case "estimate":
      return <EstimateStep key={step} />;
    case "rejected":
      return <RejectedScreen key={step} />;
    default:
      // exhaustive switch sentinel — keep STEP_ORDER updated
      void (step satisfies never);
      return null;
  }
}

// Re-export STEP_ORDER so build-time tooling can see it (unused at runtime here).
export { STEP_ORDER };
