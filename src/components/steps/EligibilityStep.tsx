// TODO(monday): Replace these placeholder questions with Luke's documented
// HUM Finance criteria. Eligibility logic also lives in src/lib/eligibility.ts.
// See TODO.md.

import { useFormStore } from "@/state/useFormStore";
import { OptionCard } from "@/components/ui/OptionCard";
import { StepHeader } from "@/components/steps/CustomerDetailsStep";
import type {
  BankruptcyAnswer,
  EmploymentStatus,
  IncomeBand,
  ResidencyAnswer,
} from "@/types/form";

const RESIDENCY: { v: ResidencyAnswer; l: string }[] = [
  { v: "yes", l: "Yes" },
  { v: "no", l: "No" },
];

const INCOME: { v: IncomeBand; l: string }[] = [
  { v: "<30k", l: "Less than $30,000" },
  { v: "30-60k", l: "$30,000 – $60,000" },
  { v: "60-100k", l: "$60,000 – $100,000" },
  { v: "100k+", l: "$100,000 +" },
];

const EMPLOYMENT: { v: EmploymentStatus; l: string }[] = [
  { v: "full_time", l: "Full-time" },
  { v: "part_time", l: "Part-time" },
  { v: "casual", l: "Casual" },
  { v: "self_employed", l: "Self-employed" },
  { v: "unemployed", l: "Unemployed" },
];

const BANKRUPTCY: { v: BankruptcyAnswer; l: string }[] = [
  { v: "no", l: "No" },
  { v: "yes", l: "Yes" },
];

export function EligibilityStep({
  errors,
}: {
  errors: Record<string, string>;
}) {
  const { eligibility, setEligibility } = useFormStore();

  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        title="Finance pre-check"
        subtitle="Quick HUM Finance eligibility — your answers stay between us."
      />

      <Group
        label="Are you an Australian resident or permanent visa holder?"
        error={errors.residency}
      >
        <div className="grid grid-cols-2 gap-2">
          {RESIDENCY.map(({ v, l }) => (
            <OptionCard
              key={v}
              name="residency"
              value={v}
              title={l}
              selected={eligibility.residency === v}
              onSelect={() => setEligibility({ residency: v })}
            />
          ))}
        </div>
      </Group>

      <Group label="Annual household income" error={errors.income}>
        <div className="flex flex-col gap-1.5">
          {INCOME.map(({ v, l }) => (
            <OptionCard
              key={v}
              name="income"
              value={v}
              title={l}
              selected={eligibility.income === v}
              onSelect={() => setEligibility({ income: v })}
            />
          ))}
        </div>
      </Group>

      <Group label="Employment status" error={errors.employment}>
        <div className="flex flex-col gap-1.5">
          {EMPLOYMENT.map(({ v, l }) => (
            <OptionCard
              key={v}
              name="employment"
              value={v}
              title={l}
              selected={eligibility.employment === v}
              onSelect={() => setEligibility({ employment: v })}
            />
          ))}
        </div>
      </Group>

      <Group
        label="Have you declared bankruptcy in the last 5 years?"
        error={errors.bankruptcy}
      >
        <div className="grid grid-cols-2 gap-2">
          {BANKRUPTCY.map(({ v, l }) => (
            <OptionCard
              key={v}
              name="bankruptcy"
              value={v}
              title={l}
              selected={eligibility.bankruptcy === v}
              onSelect={() => setEligibility({ bankruptcy: v })}
            />
          ))}
        </div>
      </Group>
    </div>
  );
}

function Group({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[13px] font-medium text-ink tracking-tight">
        {label}
      </div>
      {children}
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
