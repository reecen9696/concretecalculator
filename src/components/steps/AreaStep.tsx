import { useFormStore } from "@/state/useFormStore";
import { RadioRow } from "@/components/ui/RadioRow";
import type { AreaMethod } from "@/types/form";
import type { StepErrors } from "@/state/useFormStore";

/**
 * First half of the area flow — just pick how to measure. The matching detail
 * input (total / sections / plans) lives on the next card, AreaDetailStep, so
 * a single screen doesn't grow too tall.
 */
export function AreaStep({ errors }: { errors: StepErrors }) {
  const { area, setArea, addAreaSection } = useFormStore();

  const choose = (m: AreaMethod) => {
    setArea({ method: m });
    if (m === "sections" && area.sections.length === 0) addAreaSection();
  };

  return (
    <div className="form-section">
      <h2>Driveway Size</h2>
      <div className="form-group">
        <label className="step-question">
          How would you like to measure your driveway?
        </label>
        <RadioRow
          name="area-method"
          value="total"
          label="I know the total square metres"
          selected={area.method === "total"}
          onSelect={() => choose("total")}
        />
        <RadioRow
          name="area-method"
          value="sections"
          label="I want to measure by sections (length × width)"
          selected={area.method === "sections"}
          onSelect={() => choose("sections")}
        />
        <RadioRow
          name="area-method"
          value="plans"
          label="I'll upload plans or photos"
          selected={area.method === "plans"}
          onSelect={() => choose("plans")}
        />
        {errors.method && (
          <p className="field-error">
            <span>{errors.method}</span>
          </p>
        )}
      </div>
    </div>
  );
}
