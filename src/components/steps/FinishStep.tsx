import { useFormStore } from "@/state/useFormStore";
import type { Finish } from "@/lib/pricing";
import { OptionCard } from "@/components/ui/OptionCard";
import { StepHeader } from "@/components/steps/CustomerDetailsStep";

const OPTIONS: { v: Finish; title: string; sub: string }[] = [
  {
    v: "natural_grey",
    title: "Natural grey",
    sub: "Classic, hard-wearing concrete.",
  },
  {
    v: "coloured",
    title: "Coloured concrete",
    sub: "Custom colour mixed through the slab.",
  },
  {
    v: "exposed_aggregate",
    title: "Exposed aggregate",
    sub: "Premium decorative pebble finish.",
  },
  {
    v: "pavilion_finish",
    title: "Pavilion finish",
    sub: "Smooth, polished, architectural look.",
  },
];

export function FinishStep({ errors }: { errors: Record<string, string> }) {
  const { finish, setFinish } = useFormStore();
  return (
    <div className="flex flex-col gap-3">
      <StepHeader title="Concrete finish" subtitle="Pick the look you're after." />
      <div className="flex flex-col gap-1.5">
        {OPTIONS.map(({ v, title, sub }) => (
          <OptionCard
            key={v}
            name="finish"
            value={v}
            title={title}
            description={sub}
            selected={finish === v}
            onSelect={() => setFinish(v)}
          />
        ))}
      </div>
      {errors.finish && (
        <p className="text-[12px] text-danger">{errors.finish}</p>
      )}
    </div>
  );
}
