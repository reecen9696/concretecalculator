import { useFormStore } from "@/state/useFormStore";
import type { Slope } from "@/lib/pricing";

const OPTIONS: { v: Slope; l: string }[] = [
  { v: "flat_minimal", l: "Flat or minimal slope" },
  { v: "moderately_steep", l: "Moderately steep" },
  { v: "extremely_steep", l: "Extremely steep" },
];

export function SlopeStep({ errors }: { errors: Record<string, string> }) {
  const { slope, setSlope } = useFormStore();
  return (
    <div>
      <h2>Driveway slope</h2>
      {OPTIONS.map(({ v, l }) => (
        <label key={v}>
          <input
            type="radio"
            name="slope"
            checked={slope === v}
            onChange={() => setSlope(v)}
          />
          {l}
        </label>
      ))}
      {errors.slope && <span data-error>{errors.slope}</span>}
    </div>
  );
}
