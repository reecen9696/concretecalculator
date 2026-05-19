import { useFormStore } from "@/state/useFormStore";
import type { Drainage } from "@/lib/pricing";
import { OptionCard } from "@/components/ui/OptionCard";
import { TextField } from "@/components/ui/TextField";
import { StepHeader } from "@/components/steps/CustomerDetailsStep";

const OPTIONS: { v: Drainage; title: string; sub: string }[] = [
  {
    v: "no",
    title: "No",
    sub: "Water drains away from the garage.",
  },
  {
    v: "yes",
    title: "Yes",
    sub: "Water pools near the garage.",
  },
  { v: "unsure", title: "Unsure", sub: "We'll confirm on the site visit." },
];

export function DrainageStep({ errors }: { errors: Record<string, string> }) {
  const { drainage, setDrainage } = useFormStore();
  return (
    <div className="flex flex-col gap-3">
      <StepHeader
        title="Drainage"
        subtitle="Does water naturally fall back toward the garage?"
      />
      <div className="flex flex-col gap-1.5">
        {OPTIONS.map(({ v, title, sub }) => (
          <OptionCard
            key={v}
            name="drainage"
            value={v}
            title={title}
            description={sub}
            selected={drainage.answer === v}
            onSelect={() => setDrainage({ answer: v })}
          />
        ))}
      </div>
      {errors.drainage && (
        <p className="text-[12px] text-danger">{errors.drainage}</p>
      )}

      {drainage.answer === "yes" && (
        <div className="mt-1">
          <TextField
            label="Approximate strip drain length (metres)"
            hint="Leave blank if unsure — we'll estimate during review."
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
          />
        </div>
      )}
    </div>
  );
}
