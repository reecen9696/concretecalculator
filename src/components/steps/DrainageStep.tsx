import { useFormStore } from "@/state/useFormStore";
import { RadioRow } from "@/components/ui/RadioRow";
import { Field } from "@/components/ui/Field";
import type { Drainage } from "@/lib/pricing";
import type { StepErrors } from "@/state/useFormStore";

const OPTIONS: { v: Drainage; l: string }[] = [
  { v: "no", l: "No, water drains away" },
  { v: "yes", l: "Yes, water pools at the garage" },
  { v: "unsure", l: "Unsure" },
];

export function DrainageStep({ errors }: { errors: StepErrors }) {
  const { drainage, setDrainage } = useFormStore();
  return (
    <div className="form-section">
      <h2>Drainage</h2>
      <div className="form-group">
        <label>Does water naturally fall back toward the garage?</label>
        {OPTIONS.map(({ v, l }) => (
          <RadioRow
            key={v}
            name="drainage"
            value={v}
            label={l}
            selected={drainage.answer === v}
            onSelect={() => setDrainage({ answer: v })}
          />
        ))}
        {errors.drainage && (
          <p className="field-error">
            <span>{errors.drainage}</span>
          </p>
        )}
      </div>

      {drainage.answer === "yes" && (
        <Field
          label="Approximate strip drain length (metres) — optional"
          type="number"
          step="0.5"
          min="0"
          placeholder="6"
          value={drainage.lengthM === "" ? "" : drainage.lengthM}
          onChange={(e) =>
            setDrainage({
              lengthM: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
          hint="Leave blank if unsure — we'll estimate during review."
        />
      )}
    </div>
  );
}
