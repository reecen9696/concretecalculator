import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: ReactNode;
  /** Optional small label on the right (e.g. price). */
  meta?: ReactNode;
  name: string; // radio group name for keyboard a11y
  value: string;
}

/**
 * Radio-card primitive used by every multi-choice step (finish, slope, etc.).
 * Card receives keyboard focus, behaves like a radio button. Hover lifts the
 * border to brand orange; selected state fills border with brand and shows a
 * checkmark.
 */
export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  meta,
  name,
  value,
}: OptionCardProps) {
  return (
    <label
      className={cn(
        "group block cursor-pointer rounded-control border bg-surface-input px-3.5 py-3 transition-all duration-150 ease-soft",
        "hover:bg-surface-inputHover hover:border-brand/40",
        selected
          ? "border-brand bg-brand/[0.06] shadow-[inset_0_0_0_1px_rgba(255,102,0,0.45)]"
          : "border-transparent",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "mt-[3px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border transition-colors",
            selected
              ? "border-brand bg-brand text-white"
              : "border-ink-subtle/60 bg-transparent",
          )}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </span>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-[14px] font-semibold leading-tight tracking-tight",
              selected ? "text-ink" : "text-ink",
            )}
          >
            {title}
          </div>
          {description && (
            <div className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">
              {description}
            </div>
          )}
        </div>
        {meta && (
          <div className="flex-none text-[12px] text-ink-muted">{meta}</div>
        )}
      </div>
    </label>
  );
}
