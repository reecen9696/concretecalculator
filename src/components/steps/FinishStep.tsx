import { useFormStore } from "@/state/useFormStore";
import { RadioRow } from "@/components/ui/RadioRow";
import type { Finish } from "@/lib/pricing";

const OPTIONS: { v: Finish; title: string; sub: string }[] = [
  { v: "natural_grey", title: "Natural Grey", sub: "Classic, affordable concrete" },
  { v: "coloured", title: "Coloured Concrete", sub: "Custom colours available" },
  {
    v: "exposed_aggregate",
    title: "Exposed Aggregate",
    sub: "Premium decorative finish",
  },
  {
    v: "pavilion_finish",
    title: "Pavilion Finish",
    sub: "Premium polished surface",
  },
];

export function FinishStep() {
  const { finish, setFinish } = useFormStore();
  return (
    <div className="form-section">
      <h2>Concrete Finish</h2>
      <div className="form-group">
        <label>Select your preferred finish *</label>
        {OPTIONS.map(({ v, title, sub }) => (
          <RadioRow
            key={v}
            name="finish"
            value={v}
            title={title}
            sub={sub}
            selected={finish === v}
            onSelect={() => setFinish(v)}
          />
        ))}
      </div>
    </div>
  );
}
