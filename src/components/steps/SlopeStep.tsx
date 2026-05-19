import { useFormStore } from "@/state/useFormStore";
import type { Slope } from "@/lib/pricing";
import { OptionCard } from "@/components/ui/OptionCard";
import { StepHeader } from "@/components/steps/CustomerDetailsStep";

const OPTIONS: { v: Slope; title: string; sub: string }[] = [
  {
    v: "flat_minimal",
    title: "Flat or minimal slope",
    sub: "Mostly level ground.",
  },
  {
    v: "moderately_steep",
    title: "Moderately steep",
    sub: "Noticeable incline, walkable.",
  },
  {
    v: "extremely_steep",
    title: "Extremely steep",
    sub: "Steep gradient, may need a pump.",
  },
];

export function SlopeStep({ errors }: { errors: Record<string, string> }) {
  const { slope, setSlope } = useFormStore();
  return (
    <div className="flex flex-col gap-3">
      <StepHeader title="Driveway slope" subtitle="How steep is the site?" />
      <div className="flex flex-col gap-1.5">
        {OPTIONS.map(({ v, title, sub }) => (
          <OptionCard
            key={v}
            name="slope"
            value={v}
            title={title}
            description={sub}
            selected={slope === v}
            onSelect={() => setSlope(v)}
          />
        ))}
      </div>
      {errors.slope && (
        <p className="text-[12px] text-danger">{errors.slope}</p>
      )}
    </div>
  );
}
