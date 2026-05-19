import { useFormStore } from "@/state/useFormStore";
import { RadioRow } from "@/components/ui/RadioRow";

export function RemovalStep() {
  const { hasRemoval, setHasRemoval } = useFormStore();
  return (
    <div className="form-section">
      <h2>Existing Surface</h2>
      <div className="form-group">
        <label>Is there an existing driveway or surface to remove? *</label>
        <RadioRow
          name="removal"
          value="no"
          label="No, new site or clear area"
          selected={hasRemoval === false}
          onSelect={() => setHasRemoval(false)}
        />
        <RadioRow
          name="removal"
          value="yes"
          label="Yes, demolition / removal required"
          selected={hasRemoval === true}
          onSelect={() => setHasRemoval(true)}
        />
      </div>
    </div>
  );
}
