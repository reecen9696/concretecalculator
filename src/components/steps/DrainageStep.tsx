import { useFormStore } from "@/state/useFormStore";
import type { Drainage } from "@/lib/pricing";

const OPTIONS: { v: Drainage; l: string }[] = [
  { v: "no", l: "No, water drains away from the garage" },
  { v: "yes", l: "Yes, water pools at the garage" },
  { v: "unsure", l: "Unsure" },
];

export function DrainageStep({ errors }: { errors: Record<string, string> }) {
  const { drainage, setDrainage } = useFormStore();
  return (
    <div>
      <h2>Drainage</h2>
      <p>Does water naturally fall back toward the garage?</p>
      {OPTIONS.map(({ v, l }) => (
        <label key={v}>
          <input
            type="radio"
            name="drainage"
            checked={drainage.answer === v}
            onChange={() => setDrainage({ answer: v })}
          />
          {l}
        </label>
      ))}
      {errors.drainage && <span data-error>{errors.drainage}</span>}

      {drainage.answer === "yes" && (
        <p>
          <label>
            Approximate strip drain length (metres) — optional
            <input
              type="number"
              step="0.5"
              min="0"
              value={drainage.lengthM}
              onChange={(e) =>
                setDrainage({
                  lengthM: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              placeholder="6"
            />
          </label>
        </p>
      )}
    </div>
  );
}
