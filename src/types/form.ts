/**
 * Form types — the shape of what the customer fills in, the eligibility
 * answers, and the final submission payload sent to /api/submit.
 *
 * Pricing types (Estimate, LineItem, etc.) live in src/lib/pricing.ts.
 */

import type { Drainage, Finish, Slope } from "@/lib/pricing";

export type StepId =
  | "customer"
  | "eligibility"
  | "area"
  | "finish"
  | "removal"
  | "slope"
  | "drainage"
  | "estimate"
  | "rejected"; // outcome screen

/** All 7 input steps, in order. */
export const INPUT_STEPS = [
  "customer",
  "eligibility",
  "area",
  "finish",
  "removal",
  "slope",
  "drainage",
] as const satisfies readonly StepId[];

export type Outcome = "eligible" | "rejected";

// =============================================================================
// Step 1: Customer details
// =============================================================================

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  suburb: string;
}

// =============================================================================
// Step 2: Eligibility
// =============================================================================
// TODO(monday): Replace these placeholder fields with Luke's actual HUM Finance
// eligibility criteria. See TODO.md.

export type ResidencyAnswer = "yes" | "no";

export type IncomeBand = "<30k" | "30-60k" | "60-100k" | "100k+";

export type EmploymentStatus =
  | "full_time"
  | "part_time"
  | "casual"
  | "self_employed"
  | "unemployed";

export type BankruptcyAnswer = "yes" | "no";

export interface EligibilityAnswers {
  residency?: ResidencyAnswer;
  income?: IncomeBand;
  employment?: EmploymentStatus;
  bankruptcy?: BankruptcyAnswer;
}

// =============================================================================
// Step 3: Area
// =============================================================================

export type AreaMethod = "total" | "sections" | "via_email";

export interface AreaSection {
  /** Local UUID for keyed list rendering. */
  id: string;
  length: number | "";
  width: number | "";
}

export interface AreaState {
  method?: AreaMethod;
  totalArea: number | "";
  sections: AreaSection[];
  /** Optional free-text note when method === "via_email". */
  emailNote: string;
}

// =============================================================================
// Step 6: Drainage
// =============================================================================

export interface DrainageState {
  answer?: Drainage;
  /** Linear metres of strip drain (only consulted when answer === "yes"). */
  lengthM: number | "";
}

// =============================================================================
// Aggregate form state
// =============================================================================

export interface FormState {
  step: StepId;
  customer: CustomerDetails;
  eligibility: EligibilityAnswers;
  area: AreaState;
  finish?: Finish;
  hasRemoval?: boolean;
  slope?: Slope;
  drainage: DrainageState;
  /** Set to "rejected" the moment the eligibility check fails. */
  outcome: Outcome | null;
}

export const INITIAL_FORM_STATE: FormState = {
  step: "customer",
  customer: { name: "", phone: "", email: "", suburb: "" },
  eligibility: {},
  area: { totalArea: "", sections: [], emailNote: "" },
  drainage: { lengthM: "" },
  outcome: null,
};

// =============================================================================
// Submission payload (shipped to /api/submit)
// =============================================================================

import type { Estimate } from "@/lib/pricing";

export interface SubmissionPayload {
  outcome: Outcome;
  customer: CustomerDetails;
  eligibility: EligibilityAnswers;
  /** Reasons the eligibility check failed — present when outcome === "rejected". */
  failedCriteria?: string[];
  /** Full project details + estimate — present when outcome === "eligible". */
  project?: {
    areaSqm: number;
    areaMethod: AreaMethod;
    areaSections?: { length: number; width: number }[];
    emailNote?: string;
    finish: Finish;
    hasRemoval: boolean;
    slope: Slope;
    drainage: Drainage;
    stripDrainLengthM?: number;
  };
  estimate?: Estimate;
}
