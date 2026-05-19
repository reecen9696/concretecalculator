import { motion } from "framer-motion";
import { useFormStore, STEP_ORDER } from "@/state/useFormStore";

export function ProgressBar() {
  const step = useFormStore((s) => s.step);
  const idx = STEP_ORDER.indexOf(step);
  const total = STEP_ORDER.length;
  const visible = idx >= 0;
  const pct = visible ? ((idx + 1) / total) * 100 : 0;

  return (
    <div className="px-5 pt-1 pb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-ink-muted tnum">
          {visible ? `Step ${idx + 1} of ${total}` : ""}
        </span>
        <span className="text-[11px] font-medium text-ink-subtle tnum">
          {visible ? `${Math.round(pct)}%` : ""}
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
