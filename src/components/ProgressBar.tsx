import { useFormStore, STEP_ORDER } from "@/state/useFormStore";

export function ProgressBar() {
  const step = useFormStore((s) => s.step);
  const idx = STEP_ORDER.indexOf(step);
  if (idx < 0) return null;
  // Progress maps over the input steps (customer → photos), not the
  // estimate. When the customer lands on the photos step they've filled
  // in everything that affects pricing, so the bar reads 100% there.
  // Estimate is treated as 100% too (clamped).
  // Denominator = last input step idx = STEP_ORDER.length - 2.
  const denom = Math.max(STEP_ORDER.length - 2, 1);
  const pct = Math.min((idx / denom) * 100, 100);
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
