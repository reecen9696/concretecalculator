import { useFormStore } from "@/state/useFormStore";
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

export function FinishStep({ errors }: { errors: Record<string, string> }) {
  const { finish, setFinish } = useFormStore();
  return (
    <div>
      <h2>Concrete finish</h2>
      {OPTIONS.map(({ v, title, sub }) => (
        <label key={v}>
          <input
            type="radio"
            name="finish"
            checked={finish === v}
            onChange={() => setFinish(v)}
          />
          <strong>{title}</strong>
          <br />
          <span>{sub}</span>
        </label>
      ))}
      {errors.finish && <span data-error>{errors.finish}</span>}
    </div>
  );
}
