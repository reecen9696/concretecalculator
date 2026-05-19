// TODO(monday): Replace these placeholder questions with Luke's documented
// HUM Finance criteria. Eligibility logic also lives in src/lib/eligibility.ts.
// See TODO.md.

import { useFormStore } from "@/state/useFormStore";
import type {
  BankruptcyAnswer,
  EmploymentStatus,
  IncomeBand,
  ResidencyAnswer,
} from "@/types/form";

export function EligibilityStep({
  errors,
}: {
  errors: Record<string, string>;
}) {
  const { eligibility, setEligibility } = useFormStore();
  return (
    <div>
      <h2>Finance pre-check</h2>
      <p>Quick eligibility questions — answers stay between you and us.</p>

      <fieldset>
        <legend>Are you an Australian resident or permanent visa holder?</legend>
        {(["yes", "no"] as ResidencyAnswer[]).map((v) => (
          <label key={v}>
            <input
              type="radio"
              name="residency"
              value={v}
              checked={eligibility.residency === v}
              onChange={() => setEligibility({ residency: v })}
            />
            {v === "yes" ? "Yes" : "No"}
          </label>
        ))}
        {errors.residency && <span data-error>{errors.residency}</span>}
      </fieldset>

      <fieldset>
        <legend>Annual household income</legend>
        {(
          [
            { v: "<30k", l: "Less than $30,000" },
            { v: "30-60k", l: "$30,000 – $60,000" },
            { v: "60-100k", l: "$60,000 – $100,000" },
            { v: "100k+", l: "$100,000+" },
          ] as { v: IncomeBand; l: string }[]
        ).map(({ v, l }) => (
          <label key={v}>
            <input
              type="radio"
              name="income"
              value={v}
              checked={eligibility.income === v}
              onChange={() => setEligibility({ income: v })}
            />
            {l}
          </label>
        ))}
        {errors.income && <span data-error>{errors.income}</span>}
      </fieldset>

      <fieldset>
        <legend>Employment status</legend>
        {(
          [
            { v: "full_time", l: "Full-time" },
            { v: "part_time", l: "Part-time" },
            { v: "casual", l: "Casual" },
            { v: "self_employed", l: "Self-employed" },
            { v: "unemployed", l: "Unemployed" },
          ] as { v: EmploymentStatus; l: string }[]
        ).map(({ v, l }) => (
          <label key={v}>
            <input
              type="radio"
              name="employment"
              value={v}
              checked={eligibility.employment === v}
              onChange={() => setEligibility({ employment: v })}
            />
            {l}
          </label>
        ))}
        {errors.employment && <span data-error>{errors.employment}</span>}
      </fieldset>

      <fieldset>
        <legend>Have you declared bankruptcy in the last 5 years?</legend>
        {(["no", "yes"] as BankruptcyAnswer[]).map((v) => (
          <label key={v}>
            <input
              type="radio"
              name="bankruptcy"
              value={v}
              checked={eligibility.bankruptcy === v}
              onChange={() => setEligibility({ bankruptcy: v })}
            />
            {v === "yes" ? "Yes" : "No"}
          </label>
        ))}
        {errors.bankruptcy && <span data-error>{errors.bankruptcy}</span>}
      </fieldset>
    </div>
  );
}
