/**
 * Single-source-of-truth store for form state, step routing, and the computed
 * estimate. Thin Zustand store — no derived state stored, only inputs and
 * lifecycle flags.
 *
 * Step routing rules:
 *   customer → eligibility
 *   eligibility
 *     → rejected   (if any criterion fails)
 *     → area       (if all pass)
 *   area → finish → removal → slope → drainage → estimate
 *   estimate → outcome (handled by submission flow, not store)
 */

import { create } from "zustand";
import {
  INITIAL_FORM_STATE,
  type AreaSection,
  type CustomerDetails,
  type DrainageState,
  type EligibilityAnswers,
  type FormState,
  type StepId,
} from "@/types/form";
import type { Finish, Slope } from "@/lib/pricing";
import { evaluateEligibility } from "@/lib/eligibility";

export const STEP_ORDER: StepId[] = [
  "customer",
  "eligibility",
  "area",
  "finish",
  "removal",
  "slope",
  "drainage",
  "estimate",
];

interface FormActions {
  setStep: (step: StepId) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  setCustomer: (patch: Partial<CustomerDetails>) => void;
  setEligibility: (patch: Partial<EligibilityAnswers>) => void;
  setArea: (patch: Partial<FormState["area"]>) => void;
  addAreaSection: () => void;
  removeAreaSection: (id: string) => void;
  updateAreaSection: (id: string, patch: Partial<AreaSection>) => void;
  setFinish: (finish: Finish) => void;
  setHasRemoval: (hasRemoval: boolean) => void;
  setSlope: (slope: Slope) => void;
  setDrainage: (patch: Partial<DrainageState>) => void;
}

export type FormStore = FormState & FormActions;

const newSectionId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `s-${Math.random().toString(36).slice(2, 10)}`;

export const useFormStore = create<FormStore>((set) => ({
  ...INITIAL_FORM_STATE,

  setStep: (step) => set({ step }),

  next: () =>
    set((s) => {
      // Eligibility branch: if any criterion fails, jump to rejected.
      if (s.step === "eligibility") {
        const result = evaluateEligibility(s.eligibility);
        if (result.incomplete) return s; // validation should catch this upstream
        if (!result.eligible) return { step: "rejected", outcome: "rejected" };
      }
      const idx = STEP_ORDER.indexOf(s.step);
      const nextIdx = Math.min(idx + 1, STEP_ORDER.length - 1);
      return { step: STEP_ORDER[nextIdx] };
    }),

  back: () =>
    set((s) => {
      // From rejected screen, "back" returns to the eligibility step.
      if (s.step === "rejected") return { step: "eligibility", outcome: null };
      const idx = STEP_ORDER.indexOf(s.step);
      const prevIdx = Math.max(idx - 1, 0);
      return { step: STEP_ORDER[prevIdx] };
    }),

  reset: () => set({ ...INITIAL_FORM_STATE }),

  setCustomer: (patch) =>
    set((s) => ({ customer: { ...s.customer, ...patch } })),

  setEligibility: (patch) =>
    set((s) => ({ eligibility: { ...s.eligibility, ...patch } })),

  setArea: (patch) => set((s) => ({ area: { ...s.area, ...patch } })),

  addAreaSection: () =>
    set((s) => ({
      area: {
        ...s.area,
        sections: [
          ...s.area.sections,
          { id: newSectionId(), length: "", width: "" },
        ],
      },
    })),

  removeAreaSection: (id) =>
    set((s) => ({
      area: { ...s.area, sections: s.area.sections.filter((x) => x.id !== id) },
    })),

  updateAreaSection: (id, patch) =>
    set((s) => ({
      area: {
        ...s.area,
        sections: s.area.sections.map((x) =>
          x.id === id ? { ...x, ...patch } : x,
        ),
      },
    })),

  setFinish: (finish) => set({ finish }),
  setHasRemoval: (hasRemoval) => set({ hasRemoval }),
  setSlope: (slope) => set({ slope }),
  setDrainage: (patch) =>
    set((s) => ({ drainage: { ...s.drainage, ...patch } })),
}));

// =============================================================================
// Validation — returns inline error keys per step. UI maps these to messages.
// =============================================================================

export interface StepValidation {
  ok: boolean;
  errors: Record<string, string>;
}

export function validateStep(state: FormState): StepValidation {
  const errors: Record<string, string> = {};

  switch (state.step) {
    case "customer": {
      if (!state.customer.name.trim()) errors.name = "Full name is required.";
      if (!state.customer.phone.trim())
        errors.phone = "Phone number is required.";
      if (!state.customer.email.trim()) {
        errors.email = "Email is required.";
      } else if (!/^\S+@\S+\.\S+$/.test(state.customer.email)) {
        errors.email = "Email doesn't look right.";
      }
      if (!state.customer.suburb.trim())
        errors.suburb = "Suburb or postcode is required.";
      break;
    }
    case "eligibility": {
      if (!state.eligibility.residency) errors.residency = "Required.";
      if (!state.eligibility.income) errors.income = "Required.";
      if (!state.eligibility.employment) errors.employment = "Required.";
      if (!state.eligibility.bankruptcy) errors.bankruptcy = "Required.";
      break;
    }
    case "area": {
      const m = state.area.method;
      if (!m) {
        errors.method = "Choose how you'd like to measure.";
        break;
      }
      if (m === "total") {
        const v = Number(state.area.totalArea);
        if (!state.area.totalArea || !Number.isFinite(v) || v <= 0) {
          errors.totalArea = "Enter a total area in m².";
        }
      } else if (m === "sections") {
        const valid = state.area.sections.filter(
          (s) => Number(s.length) > 0 && Number(s.width) > 0,
        );
        if (valid.length === 0) {
          errors.sections =
            "Add at least one section with length and width above zero.";
        }
      }
      // "via_email": no validation — note is optional.
      break;
    }
    case "finish":
      if (!state.finish) errors.finish = "Pick a finish.";
      break;
    case "removal":
      if (state.hasRemoval === undefined)
        errors.removal = "Tell us about existing surface.";
      break;
    case "slope":
      if (!state.slope) errors.slope = "Pick the slope.";
      break;
    case "drainage":
      if (!state.drainage.answer) errors.drainage = "Pick a drainage option.";
      break;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

// =============================================================================
// Derived: compute the total m² for pricing.
// =============================================================================

export function computeAreaSqm(state: FormState): number {
  const m = state.area.method;
  if (m === "total") return Number(state.area.totalArea) || 0;
  if (m === "sections") {
    return state.area.sections.reduce((acc, s) => {
      const len = Number(s.length) || 0;
      const wid = Number(s.width) || 0;
      return acc + len * wid;
    }, 0);
  }
  // "via_email": no numerical area; pricing engine still needs a number.
  // Use a reasonable placeholder — Luke confirms during follow-up email.
  // We don't actually display this; the estimate step branches when method === "via_email".
  return 0;
}
