import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, hint, className, id, ...props }, ref) {
    const inputId =
      id ?? `tf-${Math.random().toString(36).slice(2, 8)}-${props.name ?? ""}`;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-ink tracking-tight"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={cn(
            "h-11 px-3 rounded-control bg-surface-input text-ink placeholder-ink-subtle text-[15px] tnum",
            "border border-transparent transition-all duration-150 ease-soft",
            "hover:bg-surface-inputHover",
            "focus:outline-none focus:bg-surface-inputHover focus:border-brand focus:shadow-focus",
            error && "border-danger/60 focus:border-danger focus:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-[12px] text-ink-subtle">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-err`} className="text-[12px] text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
