/**
 * HUM Finance eligibility check.
 *
 * TODO(monday): Replace placeholder rule with Luke's documented HUM Finance
 * criteria. Until then, eligible if ALL of:
 *   - residency === "yes"
 *   - income !== "<30k"
 *   - employment !== "unemployed"
 *   - bankruptcy === "no"
 *
 * See README.md → "Eligibility Step" and TODO.md for tracking.
 */

import type { EligibilityAnswers } from "@/types/form";

export interface EligibilityResult {
  eligible: boolean;
  /** Human-readable reasons the customer failed (empty when eligible). */
  failedCriteria: string[];
  /** True if any required question is still unanswered. */
  incomplete: boolean;
}

export function evaluateEligibility(
  answers: EligibilityAnswers,
): EligibilityResult {
  const missing: string[] = [];
  if (!answers.residency) missing.push("residency");
  if (!answers.income) missing.push("income");
  if (!answers.employment) missing.push("employment");
  if (!answers.bankruptcy) missing.push("bankruptcy");

  if (missing.length > 0) {
    return { eligible: false, failedCriteria: [], incomplete: true };
  }

  const failedCriteria: string[] = [];

  if (answers.residency !== "yes") {
    failedCriteria.push("Not an Australian resident or permanent visa holder.");
  }
  if (answers.income === "<30k") {
    failedCriteria.push("Annual household income below $30,000.");
  }
  if (answers.employment === "unemployed") {
    failedCriteria.push("Currently unemployed.");
  }
  if (answers.bankruptcy === "yes") {
    failedCriteria.push("Bankruptcy declared in the last 5 years.");
  }

  return {
    eligible: failedCriteria.length === 0,
    failedCriteria,
    incomplete: false,
  };
}
