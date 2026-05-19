import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Show character count when maxLength is set. */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, hint, showCount, className, id, value, maxLength, ...props },
    ref,
  ) {
    const inputId = id ?? `ta-${Math.random().toString(36).slice(2, 8)}`;
    const len = typeof value === "string" ? value.length : 0;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-ink tracking-tight"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          aria-invalid={!!error || undefined}
          className={cn(
            "px-3 py-2.5 rounded-control bg-surface-input text-ink placeholder-ink-subtle text-[14px] resize-none",
            "border border-transparent transition-all duration-150 ease-soft",
            "hover:bg-surface-inputHover",
            "focus:outline-none focus:bg-surface-inputHover focus:border-brand focus:shadow-focus",
            error && "border-danger/60",
            className,
          )}
          {...props}
        />
        <div className="flex justify-between text-[12px] text-ink-subtle">
          <span>{error ? <span className="text-danger">{error}</span> : hint}</span>
          {showCount && maxLength && (
            <span className="tnum">
              {len} / {maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);
