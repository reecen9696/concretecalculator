import { useFormStore } from "@/state/useFormStore";
import { RadioRow } from "@/components/ui/RadioRow";
import { FileUpload } from "@/components/ui/FileUpload";
import type { AreaMethod } from "@/types/form";

export function AreaStep() {
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

  const choose = (m: AreaMethod) => {
    setArea({ method: m });
    if (m === "sections" && area.sections.length === 0) addAreaSection();
  };

  return (
    <div className="form-section">
      <h2>Driveway Size</h2>

      <div className="form-group">
        <label>How would you like to measure your driveway? *</label>
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
      </div>

      {area.method === "total" && (
        <div className="form-group">
          <label htmlFor="totalArea">Total Area (m²) *</label>
          <input
            id="totalArea"
            className="field"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 25.5"
            value={area.totalArea === "" ? "" : area.totalArea}
            onChange={(e) =>
              setArea({
                totalArea: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
          <p className="form-hint">
            Enter the total square metres of your driveway.
          </p>
        </div>
      )}

      {area.method === "sections" && (
        <div className="form-group">
          <label>Driveway Sections</label>
          <p className="form-hint">
            Add each section. If it's one straight rectangle, just add one.
          </p>
          <div style={{ marginTop: 15 }}>
            {area.sections.map((sec, i) => {
              const segArea =
                (Number(sec.length) || 0) * (Number(sec.width) || 0);
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
        </div>
      )}

      {area.method === "plans" && (
        <div className="form-group">
          <label>Upload plans or scaled drawing *</label>
          <FileUpload
            kind="plans"
            files={plans}
            onAdd={addPlan}
            onRemove={removePlan}
            max={3}
            accept="image/*,.pdf"
            icon="📄"
            promptLabel="Click to upload plans or photos showing the driveway area"
            hint="Please highlight the driveway area as accurately as possible. We'll scale from this marked area to estimate your driveway size."
          />
        </div>
      )}
    </div>
  );
}
