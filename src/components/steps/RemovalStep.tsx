import { useFormStore } from "@/state/useFormStore";
import { OptionCard } from "@/components/ui/OptionCard";
import { StepHeader } from "@/components/steps/CustomerDetailsStep";

export function RemovalStep({ errors }: { errors: Record<string, string> }) {
  const { hasRemoval, setHasRemoval } = useFormStore();
  return (
    <div className="flex flex-col gap-3">
      <StepHeader
        title="Existing surface"
        subtitle="Is there a driveway or slab to remove first?"
      />
      <div className="flex flex-col gap-1.5">
        <OptionCard
          name="removal"
          value="no"
          title="No"
          description="New site, or area is already clear."
          selected={hasRemoval === false}
          onSelect={() => setHasRemoval(false)}
        />
        <OptionCard
          name="removal"
          value="yes"
          title="Yes"
          description="Demolition / removal required."
          selected={hasRemoval === true}
          onSelect={() => setHasRemoval(true)}
        />
      </div>
      {errors.removal && (
        <p className="text-[12px] text-danger">{errors.removal}</p>
      )}
    </div>
  );
}
