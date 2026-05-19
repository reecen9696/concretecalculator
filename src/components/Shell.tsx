import type { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
}

/**
 * The outer card — a solid-dark surface with a subtle vertical gradient,
 * hairline orange-tinted border, and soft outer shadow. Sized to sit cleanly
 * in a 360–380px iframe slot, with extra room when embedded wider.
 */
export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-[100dvh] w-full bg-transparent flex justify-center px-1.5 py-3 sm:py-4">
      <div
        className="
          w-full max-w-[380px]
          rounded-card
          border border-brand-border
          shadow-card
          bg-gradient-to-b from-[#161616] to-[#1d1d1d]
          flex flex-col
        "
      >
        <Header />
        <div className="flex-1 px-5 pb-5">{children}</div>
        <Footer />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-5 pt-5 pb-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-brand">
        Smooth Concrete
      </div>
      <h1 className="mt-1 text-[20px] font-semibold leading-tight tracking-tight text-ink">
        Driveway estimate
      </h1>
      <p className="mt-1 text-[12.5px] text-ink-muted">
        A few quick questions — your indicative quote in under a minute.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <div className="px-5 pb-4 pt-2 text-[11px] text-ink-subtle border-t border-white/[0.04]">
      Indicative pricing. Subject to site review and final approval.
    </div>
  );
}
