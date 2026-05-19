import type { ReactNode } from "react";

/** Thin container chrome matching originalcalc — dark surface, centered title. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <div className="form-header">
        <h1>Driveway Estimate</h1>
        <p>Fast, transparent pricing</p>
      </div>
      {children}
    </div>
  );
}
