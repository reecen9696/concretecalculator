import { useFormStore, STEP_ORDER } from "@/state/useFormStore";

export function ProgressBar() {
  const step = useFormStore((s) => s.step);
  const idx = STEP_ORDER.indexOf(step);
  if (idx < 0) return null;
  // 0% on the first step, 100% on the last — `idx` (0..N-1) over (N-1).
  const denom = Math.max(STEP_ORDER.length - 1, 1);
  const pct = (idx / denom) * 100;
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
