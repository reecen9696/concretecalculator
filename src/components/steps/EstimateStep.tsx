import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, AlertCircle } from "lucide-react";
import { computeAreaSqm, useFormStore } from "@/state/useFormStore";
import { calculateEstimate, type Drainage } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import { submitInquiry } from "@/lib/submit";
import { Button } from "@/components/ui/Button";
import { StepHeader } from "@/components/steps/CustomerDetailsStep";
import type { SubmissionPayload } from "@/types/form";

const HUM_PORTAL_URL =
  import.meta.env.VITE_HUM_PORTAL_URL ?? "https://hum.com.au";

export function EstimateStep() {
  const state = useFormStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const areaSqm = useMemo(() => computeAreaSqm(state), [state]);
  const isViaEmail = state.area.method === "via_email";

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
    project: state.finish && state.hasRemoval !== undefined && state.slope &&
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
    setSent(true);
  };

  // -- via_email: no price, send-to-Luke CTA --------------------------------
  if (isViaEmail) {
    const firstName = state.customer.name.trim().split(/\s+/)[0] || "there";
    if (sent) {
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
              Inquiry sent, {firstName}.
            </h2>
          </div>
          <p className="text-[13.5px] text-ink-muted leading-relaxed">
            We'll be in touch by email shortly. Send through your driveway
            measurements (length, width, and anything notable about the site)
            and we'll come back with a precise quote within 24 hours.
          </p>
        </motion.div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <StepHeader
          title="Almost there"
          subtitle="You've passed the HUM Finance pre-check. We just need your measurements."
        />
        <div className="rounded-card border border-brand/30 bg-brand/[0.06] p-4">
          <div className="flex items-start gap-3">
            <Mail size={18} className="text-brand mt-0.5 flex-none" />
            <p className="text-[13px] text-ink leading-relaxed">
              Send your inquiry and we'll email a short measurement guide. A
              precise quote follows once your measurements are in.
            </p>
          </div>
        </div>
        {error && <ErrorBanner message={error} />}
        <Button
          size="lg"
          onClick={handleProceed}
          loading={submitting}
          rightIcon={!submitting ? <ArrowRight size={16} /> : undefined}
        >
          Send inquiry to Smooth Concrete
        </Button>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="py-4 text-[13px] text-ink-muted">Calculating…</div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3"
    >
      <StepHeader
        title="Your estimate"
        subtitle="Indicative inc-GST price + finance options."
      />

      <div className="rounded-card border border-brand/30 bg-gradient-to-b from-brand/[0.10] to-brand/[0.02] p-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-medium">
          Estimated project investment
        </div>
        <div className="mt-1 tnum text-[34px] font-bold leading-none tracking-tight text-ink">
          {formatCurrency(estimate.finalIncGst)}
        </div>
        <div className="mt-2 text-[12px] text-ink-subtle">
          Subject to site review and final approval.
        </div>
      </div>

      <div className="rounded-card border border-white/[0.06] bg-surface-input p-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted font-medium">
          Repayments · HUM Finance
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[11px] text-ink-muted">from</span>
          <span className="tnum text-[28px] font-bold leading-none tracking-tight text-brand">
            {formatCurrency(estimate.repayment.weekly)}
          </span>
          <span className="text-[13px] text-ink-muted">/week</span>
        </div>
        <div className="mt-2 text-[12px] text-ink-muted">
          Over {estimate.repayment.fortnights} fortnights (
          {estimate.repayment.termWeeks} weeks) ·{" "}
          <span className="tnum text-ink">
            {formatCurrency(estimate.repayment.fortnightly)}
          </span>{" "}
          per fortnight.
        </div>
      </div>

      {estimate.reviewFlags.length > 0 && (
        <div className="rounded-control border border-warning/30 bg-warning/[0.06] p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-warning mt-0.5 flex-none" />
            <ul className="text-[12px] text-ink-muted leading-snug space-y-1">
              {estimate.reviewFlags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      <Button
        size="lg"
        onClick={handleProceed}
        loading={submitting}
        rightIcon={!submitting ? <ArrowRight size={16} /> : undefined}
      >
        Continue to HUM Finance
      </Button>
    </motion.div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-control border border-danger/40 bg-danger/[0.08] p-3 text-[12.5px] text-ink">
      <div className="flex items-start gap-2">
        <AlertCircle size={14} className="text-danger mt-0.5 flex-none" />
        <span>{message}</span>
      </div>
    </div>
  );
}
