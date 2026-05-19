import type { ReactNode } from "react";

/** Thin container chrome matching originalcalc — dark surface, centered title. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <div className="form-header">
        <h1>Get A Instant Estimate</h1>
      </div>
      {children}
    </div>
  );
}
