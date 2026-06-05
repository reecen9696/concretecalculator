import { useFormStore } from "@/state/useFormStore";
import { FileUpload } from "@/components/ui/FileUpload";
import { DocumentIcon } from "@/components/ui/icons";
import type { StepErrors } from "@/state/useFormStore";

/**
 * Second half of the area flow — the detail input matching the method chosen
 * on AreaStep. Split onto its own card so neither screen grows too tall.
 */
export function AreaDetailStep({ errors }: { errors: StepErrors }) {
  const {
    area,
    setArea,
    addAreaSection,
    removeAreaSection,
    updateAreaSection,
    plans,
    addPlan,
    removePlan,
  } = useFormStore();

  const sectionsClass = (sec: { length: number | ""; width: number | "" }) =>
    errors.sections && (!(Number(sec.length) > 0) || !(Number(sec.width) > 0))
      ? "is-invalid"
      : "";

  const title =
    area.method === "sections"
      ? "Driveway Sections"
      : area.method === "plans"
        ? "Upload Plans or Photos"
        : "Total Area";

  return (
    <div className="form-section">
      <h2>{title}</h2>

      {area.method === "total" && (
        <div className="field-group">
          <label htmlFor="totalArea">Total Area (m²)</label>
          <input
            id="totalArea"
            className="field"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 25.5"
            value={area.totalArea === "" ? "" : area.totalArea}
            aria-invalid={errors.totalArea ? true : undefined}
            onChange={(e) =>
              setArea({
                totalArea: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
          <div className="field-help">
            {errors.totalArea ? (
              <p className="field-error">
                <span>{errors.totalArea}</span>
              </p>
            ) : (
              <p className="form-hint">
                Enter the total square metres of your driveway.
              </p>
            )}
          </div>
        </div>
      )}

      {area.method === "sections" && (
        <div className="form-group">
          <p className="form-hint">
            Add each section. If it's one straight rectangle, just add one.
          </p>
          <div style={{ marginTop: 15 }}>
            {area.sections.map((sec, i) => {
              const segArea =
                (Number(sec.length) || 0) * (Number(sec.width) || 0);
              const invalidCls = sectionsClass(sec);
              return (
                <div className="area-card" key={sec.id}>
                  <h4>Section {i + 1}</h4>
                  <div className="area-grid">
                    <div>
                      <label htmlFor={`l-${sec.id}`}>Length (m)</label>
                      <input
                        id={`l-${sec.id}`}
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g. 6"
                        className={invalidCls}
                        value={sec.length === "" ? "" : sec.length}
                        onChange={(e) =>
                          updateAreaSection(sec.id, {
                            length:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor={`w-${sec.id}`}>Width (m)</label>
                      <input
                        id={`w-${sec.id}`}
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g. 3.5"
                        className={invalidCls}
                        value={sec.width === "" ? "" : sec.width}
                        onChange={(e) =>
                          updateAreaSection(sec.id, {
                            width:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="area-calculated">
                    {segArea > 0 ? (
                      <>
                        = <strong>{segArea.toFixed(2)} m²</strong>
                      </>
                    ) : (
                      "Enter measurements"
                    )}
                  </div>
                  {area.sections.length > 1 && (
                    <div className="area-actions">
                      <button
                        type="button"
                        className="btn-remove-area"
                        onClick={() => removeAreaSection(sec.id)}
                      >
                        Remove Section
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addAreaSection}
              style={{ flex: "none" }}
            >
              + Add another section
            </button>
          </div>
          {errors.sections && (
            <p className="field-error">
              <span>{errors.sections}</span>
            </p>
          )}
        </div>
      )}

      {area.method === "plans" && (
        <div className="form-group">
          <label>Upload plans or scaled drawing</label>
          <FileUpload
            kind="plans"
            files={plans}
            onAdd={addPlan}
            onRemove={removePlan}
            max={3}
            accept="image/*,.pdf"
            icon={<DocumentIcon />}
            promptLabel="Click to upload plans or photos showing the driveway area"
            hint="Please highlight the driveway area as accurately as possible. We'll scale from this marked area to estimate your driveway size."
            invalid={!!errors.plans}
          />
          {errors.plans && (
            <p className="field-error">
              <span>{errors.plans}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
