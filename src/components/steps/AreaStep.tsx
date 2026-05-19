import { useFormStore } from "@/state/useFormStore";
import type { AreaMethod } from "@/types/form";
import { OptionCard } from "@/components/ui/OptionCard";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";
import { StepHeader } from "@/components/steps/CustomerDetailsStep";

const EMAIL_NOTE_MAX = 500;

const METHODS: { v: AreaMethod; title: string; sub: string }[] = [
  {
    v: "total",
    title: "I know the total m²",
    sub: "Just type it in.",
  },
  {
    v: "sections",
    title: "Measure by section",
    sub: "Length × width — we'll add them up.",
  },
  {
    v: "via_email",
    title: "Send measurements via email",
    sub: "We'll follow up to collect them.",
  },
];

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
    <div className="flex flex-col gap-3">
      <StepHeader title="Driveway size" subtitle="Pick whichever's easiest." />
      <div className="flex flex-col gap-1.5">
        {METHODS.map(({ v, title, sub }) => (
          <OptionCard
            key={v}
            name="area-method"
            value={v}
            title={title}
            description={sub}
            selected={area.method === v}
            onSelect={() => choose(v)}
          />
        ))}
      </div>
      {errors.method && (
        <p className="text-[12px] text-danger">{errors.method}</p>
      )}

      {area.method === "total" && (
        <div className="mt-1">
          <TextField
            label="Total area (m²)"
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
            error={errors.totalArea}
          />
        </div>
      )}

      {area.method === "sections" && (
        <div className="mt-1 flex flex-col gap-2">
          {area.sections.map((sec, i) => {
            const segArea = (Number(sec.length) || 0) * (Number(sec.width) || 0);
            return (
              <div
                key={sec.id}
                className="rounded-control bg-surface-input p-3 border border-white/[0.04]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[12px] font-medium text-ink-muted uppercase tracking-wider">
                    Section {i + 1}
                  </div>
                  {area.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAreaSection(sec.id)}
                      className="text-ink-subtle hover:text-danger transition-colors p-1 -m-1 rounded"
                      aria-label="Remove section"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="Length (m)"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="6"
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
                  <TextField
                    label="Width (m)"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="3.5"
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
                <div className="mt-2 text-[12px] text-ink-muted tnum">
                  {segArea > 0
                    ? `= ${segArea.toFixed(2)} m²`
                    : "Enter both dimensions"}
                </div>
              </div>
            );
          })}
          <Button
            variant="secondary"
            size="md"
            onClick={addAreaSection}
            leftIcon={<Plus size={14} />}
          >
            Add another section
          </Button>
          {sectionsTotal > 0 && (
            <div className="text-[13px] text-ink mt-1">
              Total:{" "}
              <span className="font-semibold tnum">
                {sectionsTotal.toFixed(2)} m²
              </span>
            </div>
          )}
          {errors.sections && (
            <p className="text-[12px] text-danger">{errors.sections}</p>
          )}
        </div>
      )}

      {area.method === "via_email" && (
        <div className="mt-1">
          <Textarea
            label="Anything we should know? (optional)"
            placeholder="Rough length, shape, anything tricky we should know about…"
            rows={4}
            maxLength={EMAIL_NOTE_MAX}
            showCount
            value={area.emailNote}
            onChange={(e) => setArea({ emailNote: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
