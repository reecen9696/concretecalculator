import { useFormStore, STEP_ORDER } from "@/state/useFormStore";

export function ProgressBar() {
  const step = useFormStore((s) => s.step);
  const idx = STEP_ORDER.indexOf(step);
  if (idx < 0) return null;
  const pct = ((idx + 1) / STEP_ORDER.length) * 100;
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
