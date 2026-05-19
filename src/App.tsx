import { useFormStore, validateStep, STEP_ORDER } from "@/state/useFormStore";
import { useState } from "react";
import { CustomerDetailsStep } from "@/components/steps/CustomerDetailsStep";
import { EligibilityStep } from "@/components/steps/EligibilityStep";
import { AreaStep } from "@/components/steps/AreaStep";
import { FinishStep } from "@/components/steps/FinishStep";
import { RemovalStep } from "@/components/steps/RemovalStep";
import { SlopeStep } from "@/components/steps/SlopeStep";
import { DrainageStep } from "@/components/steps/DrainageStep";
import { EstimateStep } from "@/components/steps/EstimateStep";
import { RejectedScreen } from "@/components/steps/outcomes/RejectedScreen";
import { StepNav } from "@/components/StepNav";

export default function App() {
  const state = useFormStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Outcome screens render without the regular step navigation.
  if (state.step === "rejected") {
    return (
      <div style={{ padding: 20, maxWidth: 380, margin: "0 auto" }}>
        <RejectedScreen />
        <StepNav
          canBack={true}
          nextLabel=""
          onBack={handleBack}
          onNext={() => {}}
          nextDisabled
        />
      </div>
    );
  }

  if (state.step === "estimate") {
    return (
      <div style={{ padding: 20, maxWidth: 380, margin: "0 auto" }}>
        <Progress />
        <EstimateStep />
        <button type="button" onClick={handleBack}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 380, margin: "0 auto" }}>
      <Progress />
      <Step errors={errors} />
      <StepNav
        canBack={state.step !== "customer"}
        nextLabel={state.step === "drainage" ? "See estimate →" : "Next →"}
        onBack={handleBack}
        onNext={handleNext}
      />
    </div>
  );
}

function Progress() {
  const step = useFormStore((s) => s.step);
  const idx = STEP_ORDER.indexOf(step);
  if (idx < 0) return null;
  const pct = ((idx + 1) / STEP_ORDER.length) * 100;
  return (
    <div
      style={{
        height: 4,
        background: "#2a2a2a",
        borderRadius: 2,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "#FF6600",
          transition: "width 300ms ease",
        }}
      />
    </div>
  );
}

function Step({ errors }: { errors: Record<string, string> }) {
  const step = useFormStore((s) => s.step);
  switch (step) {
    case "customer":
      return <CustomerDetailsStep errors={errors} />;
    case "eligibility":
      return <EligibilityStep errors={errors} />;
    case "area":
      return <AreaStep errors={errors} />;
    case "finish":
      return <FinishStep errors={errors} />;
    case "removal":
      return <RemovalStep errors={errors} />;
    case "slope":
      return <SlopeStep errors={errors} />;
    case "drainage":
      return <DrainageStep errors={errors} />;
    default:
      return null;
  }
}
