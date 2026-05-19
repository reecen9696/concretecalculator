import { useFormStore } from "@/state/useFormStore";
import type { AreaMethod } from "@/types/form";

const EMAIL_NOTE_MAX = 500;

export function AreaStep({ errors }: { errors: Record<string, string> }) {
  const {
    area,
    setArea,
    addAreaSection,
    removeAreaSection,
    updateAreaSection,
  } = useFormStore();

  const sectionsTotal = area.sections.reduce(
    (acc, s) => acc + (Number(s.length) || 0) * (Number(s.width) || 0),
    0,
  );

  const choose = (m: AreaMethod) => {
    setArea({ method: m });
    if (m === "sections" && area.sections.length === 0) addAreaSection();
  };

  return (
    <div>
      <h2>Driveway size</h2>
      <p>
        <label>
          <input
            type="radio"
            name="area-method"
            checked={area.method === "total"}
            onChange={() => choose("total")}
          />
          I know the total square metres
        </label>
        <label>
          <input
            type="radio"
            name="area-method"
            checked={area.method === "sections"}
            onChange={() => choose("sections")}
          />
          I'd like to measure by section (length × width)
        </label>
        <label>
          <input
            type="radio"
            name="area-method"
            checked={area.method === "via_email"}
            onChange={() => choose("via_email")}
          />
          I'll send measurements via email
        </label>
        {errors.method && <span data-error>{errors.method}</span>}
      </p>

      {area.method === "total" && (
        <p>
          <label>
            Total area (m²)
            <input
              type="number"
              step="0.1"
              min="0"
              value={area.totalArea}
              onChange={(e) =>
                setArea({
                  totalArea: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              placeholder="e.g. 25.5"
            />
          </label>
          {errors.totalArea && <span data-error>{errors.totalArea}</span>}
        </p>
      )}

      {area.method === "sections" && (
        <div>
          {area.sections.map((sec, i) => (
            <div key={sec.id} data-section>
              <h4>Section {i + 1}</h4>
              <label>
                Length (m)
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={sec.length}
                  onChange={(e) =>
                    updateAreaSection(sec.id, {
                      length:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Width (m)
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={sec.width}
                  onChange={(e) =>
                    updateAreaSection(sec.id, {
                      width:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </label>
              {area.sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAreaSection(sec.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addAreaSection}>
            + Add another section
          </button>
          <p>
            Total: {sectionsTotal.toFixed(2)} m²
          </p>
          {errors.sections && <span data-error>{errors.sections}</span>}
        </div>
      )}

      {area.method === "via_email" && (
        <p>
          <label>
            Anything you'd like us to know about your driveway? (optional)
            <textarea
              value={area.emailNote}
              maxLength={EMAIL_NOTE_MAX}
              onChange={(e) => setArea({ emailNote: e.target.value })}
              placeholder="Rough length, shape, anything tricky we should know about…"
              rows={3}
            />
          </label>
          <span>
            {area.emailNote.length} / {EMAIL_NOTE_MAX}
          </span>
        </p>
      )}
    </div>
  );
}
