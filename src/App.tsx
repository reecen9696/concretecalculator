import { useEffect, useState } from "react";
import {
  useFormStore,
  validateStep,
  STEP_ORDER,
  type StepErrors,
} from "@/state/useFormStore";
import { Shell } from "@/components/Shell";
import { ProgressBar } from "@/components/ProgressBar";
import { CustomerDetailsStep } from "@/components/steps/CustomerDetailsStep";
import { AreaStep } from "@/components/steps/AreaStep";
import { AreaDetailStep } from "@/components/steps/AreaDetailStep";
import { FinishStep } from "@/components/steps/FinishStep";
import { RemovalStep } from "@/components/steps/RemovalStep";
import { SlopeStep } from "@/components/steps/SlopeStep";
import { DrainageStep } from "@/components/steps/DrainageStep";
import { PhotosStep } from "@/components/steps/PhotosStep";
import { EstimateStep } from "@/components/steps/EstimateStep";

export default function App() {
  const state = useFormStore();
  const [errors, setErrors] = useState<StepErrors>({});

  // Clear errors + scroll content to top whenever the step changes.
  useEffect(() => {
    setErrors({});
    const content = document.querySelector(".form-content");
    if (content) content.scrollTop = 0;
  }, [state.step]);

  const handleNext = () => {
    const v = validateStep(state);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    state.next();
  };
  const handleBack = () => {
    setErrors({});
    state.back();
  };

  const stepIdx = STEP_ORDER.indexOf(state.step);
  const isEstimate = state.step === "estimate";
  const isFirstStep = stepIdx === 0;
  // Last data-entry step = the one right before the estimate (now "customer").
  const isLastInputStep = stepIdx === STEP_ORDER.length - 2;

  return (
    <Shell>
      {/* Scrollable middle (current step content) */}
      <div className="form-content">
        <StepView errors={errors} />
      </div>

      {/* Pinned footer (buttons stuck to bottom) */}
      {!isEstimate && (
        <div className="btn-row">
          {!isFirstStep && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
          >
            {isLastInputStep ? "See estimate →" : "Next →"}
          </button>
        </div>
      )}

      {/* The estimate step is terminal — no footer buttons. The inquiry is
          submitted automatically on arrival; the step shows a next-steps
          message instead of a Back / Continue action. */}

      {/* Bottom-pinned progress bar — absolute positioning means JSX
          order doesn't matter, but kept last for readability. */}
      <ProgressBar />
    </Shell>
  );
}

function StepView({ errors }: { errors: StepErrors }) {
  const step = useFormStore((s) => s.step);
  switch (step) {
    case "customer":
      return <CustomerDetailsStep key={step} errors={errors} />;
    case "area":
      return <AreaStep key={step} errors={errors} />;
    case "area-detail":
      return <AreaDetailStep key={step} errors={errors} />;
    case "finish":
      return <FinishStep key={step} errors={errors} />;
    case "removal":
      return <RemovalStep key={step} errors={errors} />;
    case "slope":
      return <SlopeStep key={step} errors={errors} />;
    case "drainage":
      return <DrainageStep key={step} errors={errors} />;
    case "photos":
      return <PhotosStep key={step} errors={errors} />;
    case "estimate":
      return <EstimateStep key={step} />;
    default:
      void (step satisfies never);
      return null;
  }
}
