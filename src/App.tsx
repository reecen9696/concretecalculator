import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useFormStore, validateStep } from "@/state/useFormStore";
import { Shell } from "@/components/Shell";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/Button";
import { CustomerDetailsStep } from "@/components/steps/CustomerDetailsStep";
import { EligibilityStep } from "@/components/steps/EligibilityStep";
import { AreaStep } from "@/components/steps/AreaStep";
import { FinishStep } from "@/components/steps/FinishStep";
import { RemovalStep } from "@/components/steps/RemovalStep";
import { SlopeStep } from "@/components/steps/SlopeStep";
import { DrainageStep } from "@/components/steps/DrainageStep";
import { EstimateStep } from "@/components/steps/EstimateStep";
import { RejectedScreen } from "@/components/steps/outcomes/RejectedScreen";

const STEP_TRANSITION = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

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

  const isOutcome = state.step === "rejected";
  const isEstimate = state.step === "estimate";

  const nextLabel =
    state.step === "drainage" ? "See estimate" : "Continue";

  return (
    <Shell>
      {!isOutcome && <ProgressBar />}

      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={STEP_TRANSITION}
          >
            {renderStep(state.step, errors)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation: hidden on outcome screens (rejected) and on the
          estimate step's success state (which manages its own CTA). */}
      {!isOutcome && !isEstimate && (
        <div className="mt-5 flex gap-2">
          {state.step !== "customer" && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleBack}
              leftIcon={<ArrowLeft size={14} />}
              className="flex-none px-3"
              aria-label="Go back"
            >
              Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleNext}
            rightIcon={<ArrowRight size={14} />}
            className="flex-1"
          >
            {nextLabel}
          </Button>
        </div>
      )}

      {/* Estimate step: only show a Back link, the proceed CTA is in-step. */}
      {isEstimate && (
        <div className="mt-3 flex justify-start">
          <Button
            variant="ghost"
            size="md"
            onClick={handleBack}
            leftIcon={<ArrowLeft size={14} />}
            className="-ml-1"
          >
            Back
          </Button>
        </div>
      )}

      {/* Rejected screen: allow Back to revise eligibility answers. */}
      {isOutcome && (
        <div className="mt-3 flex justify-start">
          <Button
            variant="ghost"
            size="md"
            onClick={handleBack}
            leftIcon={<ArrowLeft size={14} />}
            className="-ml-1"
          >
            Revise answers
          </Button>
        </div>
      )}
    </Shell>
  );
}

function renderStep(step: string, errors: Record<string, string>) {
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
    case "estimate":
      return <EstimateStep />;
    case "rejected":
      return <RejectedScreen />;
    default:
      return null;
  }
}
