/**
 * Form types — the shape of what the customer fills in, the eligibility
 * answers, uploaded files, and the final submission payload sent to /api/submit.
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
  | "photos"
  | "estimate"
  | "rejected"; // outcome screen

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
// Step 3: Area  (matches originalcalc: total / sections / plans)
// =============================================================================

export type AreaMethod = "total" | "sections" | "plans";

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
}

// =============================================================================
// Step 7: Drainage
// =============================================================================

export interface DrainageState {
  answer?: Drainage;
  /** Linear metres of strip drain (only consulted when answer === "yes"). */
  lengthM: number | "";
}

// =============================================================================
// Uploaded files (plans @ area step + photos @ photos step)
// =============================================================================

export interface UploadedFile {
  /** Public Vercel Blob URL. */
  url: string;
  filename: string;
  contentType: string;
  /** Size in bytes (for display only). */
  size: number;
}

// =============================================================================
// Aggregate form state
// =============================================================================

export interface FormState {
  step: StepId;
  customer: CustomerDetails;
  eligibility: EligibilityAnswers;
  area: AreaState;
  /** Site plan / dimensioned drawings uploaded inline at the area step. */
  plans: UploadedFile[];
  finish?: Finish;
  hasRemoval?: boolean;
  slope?: Slope;
  drainage: DrainageState;
  /** Project photos uploaded at the dedicated photos step. */
  photos: UploadedFile[];
  /** Set to "rejected" the moment the eligibility check fails. */
  outcome: Outcome | null;
}

export const INITIAL_FORM_STATE: FormState = {
  step: "customer",
  customer: { name: "", phone: "", email: "", suburb: "" },
  eligibility: {},
  area: { totalArea: "", sections: [] },
  plans: [],
  drainage: { lengthM: "" },
  photos: [],
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
    finish: Finish;
    hasRemoval: boolean;
    slope: Slope;
    drainage: Drainage;
    stripDrainLengthM?: number;
  };
  /** Blob URLs of uploaded files (plans + photos), present on eligible path. */
  plans?: UploadedFile[];
  photos?: UploadedFile[];
  estimate?: Estimate;
}
