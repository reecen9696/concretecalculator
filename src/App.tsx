import { useEffect, useState } from "react";
import {
  useFormStore,
  validateStep,
  type StepErrors,
} from "@/state/useFormStore";
import { Shell } from "@/components/Shell";
import { ProgressBar } from "@/components/ProgressBar";
import { CustomerDetailsStep } from "@/components/steps/CustomerDetailsStep";
import {
  ResidencyStep,
  IncomeStep,
  EmploymentStep,
  BankruptcyStep,
} from "@/components/steps/EligibilitySteps";
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

  const isRejected = state.step === "rejected";
  const isEstimate = state.step === "estimate";
  const isFirstStep = state.step === "customer";
  const isLastInputStep = state.step === "photos";

  return (
    <Shell>
      {/* Pinned header (progress bar) */}
      {!isRejected && (
        <div className="form-top">
          <ProgressBar />
        </div>
      )}

      {/* Scrollable middle (current step content) */}
      <div className="form-content">
        <StepView errors={errors} />
      </div>

      {/* Pinned footer (buttons stuck to bottom) */}
      {!isRejected && !isEstimate && (
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

      {isEstimate && (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
          >
            ← Back
          </button>
        </div>
      )}

      {isRejected && (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
          >
            ← Revise answers
          </button>
        </div>
      )}
    </Shell>
  );
}

function StepView({ errors }: { errors: StepErrors }) {
  const step = useFormStore((s) => s.step);
  switch (step) {
    case "customer":
      return <CustomerDetailsStep key={step} errors={errors} />;
    case "elig-residency":
      return <ResidencyStep key={step} errors={errors} />;
    case "elig-income":
      return <IncomeStep key={step} errors={errors} />;
    case "elig-employment":
      return <EmploymentStep key={step} errors={errors} />;
    case "elig-bankruptcy":
      return <BankruptcyStep key={step} errors={errors} />;
    case "area":
      return <AreaStep key={step} errors={errors} />;
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
    case "rejected":
      return <RejectedScreen key={step} />;
    default:
      void (step satisfies never);
      return null;
  }
}
