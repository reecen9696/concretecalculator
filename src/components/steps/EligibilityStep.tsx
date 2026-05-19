// TODO(monday): Replace these placeholder questions with Luke's documented
// HUM Finance criteria. Eligibility logic also lives in src/lib/eligibility.ts.
// See TODO.md.

import { useFormStore } from "@/state/useFormStore";
import { RadioRow } from "@/components/ui/RadioRow";
import type {
  BankruptcyAnswer,
  EmploymentStatus,
  IncomeBand,
  ResidencyAnswer,
} from "@/types/form";

const INCOME: { v: IncomeBand; l: string }[] = [
  { v: "<30k", l: "Less than $30,000" },
  { v: "30-60k", l: "$30,000 – $60,000" },
  { v: "60-100k", l: "$60,000 – $100,000" },
  { v: "100k+", l: "$100,000+" },
];
const EMPLOYMENT: { v: EmploymentStatus; l: string }[] = [
  { v: "full_time", l: "Full-time" },
  { v: "part_time", l: "Part-time" },
  { v: "casual", l: "Casual" },
  { v: "self_employed", l: "Self-employed" },
  { v: "unemployed", l: "Unemployed" },
];

export function EligibilityStep() {
  const { eligibility, setEligibility } = useFormStore();
  return (
    <div className="form-section">
      <h2>HUM Finance Pre-Check</h2>

      <div className="form-group">
        <label>Are you an Australian resident or permanent visa holder? *</label>
        {(["yes", "no"] as ResidencyAnswer[]).map((v) => (
          <RadioRow
            key={v}
            name="residency"
            value={v}
            label={v === "yes" ? "Yes" : "No"}
            selected={eligibility.residency === v}
            onSelect={() => setEligibility({ residency: v })}
          />
        ))}
      </div>

      <div className="form-group">
        <label>Annual household income *</label>
        {INCOME.map(({ v, l }) => (
          <RadioRow
            key={v}
            name="income"
            value={v}
            label={l}
            selected={eligibility.income === v}
            onSelect={() => setEligibility({ income: v })}
          />
        ))}
      </div>

      <div className="form-group">
        <label>Employment status *</label>
        {EMPLOYMENT.map(({ v, l }) => (
          <RadioRow
            key={v}
            name="employment"
            value={v}
            label={l}
            selected={eligibility.employment === v}
            onSelect={() => setEligibility({ employment: v })}
          />
        ))}
      </div>

      <div className="form-group">
        <label>Have you declared bankruptcy in the last 5 years? *</label>
        {(["no", "yes"] as BankruptcyAnswer[]).map((v) => (
          <RadioRow
            key={v}
            name="bankruptcy"
            value={v}
            label={v === "yes" ? "Yes" : "No"}
            selected={eligibility.bankruptcy === v}
            onSelect={() => setEligibility({ bankruptcy: v })}
          />
        ))}
      </div>
    </div>
  );
}
