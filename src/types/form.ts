/**
 * Form types — the shape of what the customer fills in, uploaded files, and
 * the final submission payload sent to /api/submit.
 *
 * Pricing types (Estimate, LineItem, etc.) live in src/lib/pricing.ts.
 */

import type { Drainage, Finish, Slope } from "@/lib/pricing";

export type StepId =
  | "customer"
  | "area"
  | "area-detail"
  | "finish"
  | "removal"
  | "slope"
  | "drainage"
  | "photos"
  | "estimate";

/** Steps that count toward the visible progress bar. */
export const STEP_ORDER: StepId[] = [
  "customer",
  "area",
  "area-detail",
  "finish",
  "removal",
  "slope",
  "drainage",
  "photos",
  "estimate",
];

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
// Step 2: Area (total / sections / plans)
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
// Drainage
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
  area: AreaState;
  /** Site plan / dimensioned drawings uploaded inline at the area step. */
  plans: UploadedFile[];
  finish?: Finish;
  hasRemoval?: boolean;
  slope?: Slope;
  drainage: DrainageState;
  /** Project photos uploaded at the dedicated photos step. */
  photos: UploadedFile[];
}

export const INITIAL_FORM_STATE: FormState = {
  step: "customer",
  customer: { name: "", phone: "", email: "", suburb: "" },
  area: { totalArea: "", sections: [] },
  plans: [],
  drainage: { lengthM: "" },
  photos: [],
};

// =============================================================================
// Submission payload (shipped to /api/submit)
// =============================================================================

import type { Estimate } from "@/lib/pricing";

export interface SubmissionPayload {
  customer: CustomerDetails;
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
  /** Blob URLs of uploaded files (plans + photos). */
  plans?: UploadedFile[];
  photos?: UploadedFile[];
  estimate?: Estimate;
}
