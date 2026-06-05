import type { ReactNode } from "react";
import { useFormStore } from "@/state/useFormStore";

/** Thin container chrome matching originalcalc — dark surface, centered title.
 * The "Get A Instant Estimate" header only shows on the first step; on every
 * later step the per-step orange title (.form-section h2) serves as the
 * heading instead. */
export function Shell({ children }: { children: ReactNode }) {
  const step = useFormStore((s) => s.step);
  return (
    <div className="container">
      {step === "customer" && (
        <div className="form-header">
          <h1>Get a 98% accurate quote, instantly</h1>
          <p>
            Input your driveway details and we'll give you an instant, near-exact
            estimate — no waiting, no call required.
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
