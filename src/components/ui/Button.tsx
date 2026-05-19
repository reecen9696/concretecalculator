import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold tracking-tight transition-all duration-200 ease-soft select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  md: "h-11 px-4 text-[14px]",
  lg: "h-12 px-5 text-[15px]",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-cta hover:bg-brand-hover hover:-translate-y-[1px] active:translate-y-0 disabled:hover:translate-y-0 disabled:shadow-none",
  secondary:
    "bg-surface-input text-ink hover:bg-surface-inputHover border border-white/5",
  ghost: "text-ink-muted hover:text-ink",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon}
        <span>{loading ? "Sending…" : children}</span>
        {rightIcon}
      </button>
    );
  },
);
