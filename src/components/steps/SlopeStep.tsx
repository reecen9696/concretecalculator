import { useFormStore } from "@/state/useFormStore";
import { RadioRow } from "@/components/ui/RadioRow";
import type { Slope } from "@/lib/pricing";

const OPTIONS: { v: Slope; l: string }[] = [
  { v: "flat_minimal", l: "Flat or minimal slope" },
  { v: "moderately_steep", l: "Moderately steep" },
  { v: "extremely_steep", l: "Extremely steep" },
];

export function SlopeStep() {
  const { slope, setSlope } = useFormStore();
  return (
    <div className="form-section">
      <h2>Driveway Slope</h2>
      <div className="form-group">
        <label>How steep is the driveway? *</label>
        {OPTIONS.map(({ v, l }) => (
          <RadioRow
            key={v}
            name="slope"
            value={v}
            label={l}
            selected={slope === v}
            onSelect={() => setSlope(v)}
          />
        ))}
      </div>
    </div>
  );
}
