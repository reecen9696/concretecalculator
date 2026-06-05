/**
 * Pricing engine — direct TypeScript port of originalcalc/backend/pricing_engine.py.
 *
 * Math is intentionally faithful to the reference (line-by-line in places).
 * If you change the math, the parity test must still pass:
 *
 *     npm run parity
 *
 * Outputs must match the Python reference to the cent.
 */

import { PRICING, type HumBracket } from "@/config/pricing";
import { formatBracketRange, roundHalfEven } from "@/lib/format";

// =============================================================================
// Inputs
// =============================================================================

export type Finish =
  | "natural_grey"
  | "coloured"
  | "exposed_aggregate"
  | "pavilion_finish";

export type Slope = "flat_minimal" | "moderately_steep" | "extremely_steep";

export type Drainage = "no" | "yes" | "unsure";

export interface PricingInputs {
  areaSqm: number;
  finish: Finish;
  hasRemoval: boolean;
  slope: Slope;
  drainage: Drainage;
  /** Linear metres of strip drain. Only consulted when drainage === "yes". */
  stripDrainLengthM?: number;
}

// =============================================================================
// Outputs
// =============================================================================

export interface LineItem {
  description: string;
  amount: number;
}

export interface BracketSnapshot {
  from: number;
  to: number;
  fortnights: number;
  feePercent: number;
  rangeDesc: string;
}

export interface OptimizationDetails {
  reason: string;
  feeSavings: number;
  discountAmount: number;
  netBenefit: number;
}

export interface Repayment {
  termWeeks: number;
  fortnights: number;
  fortnightly: number;
  weekly: number;
}

export interface Estimate {
  inputs: PricingInputs;
  lineItems: LineItem[];
  /** Sum of line items, before the minimum-floor is applied. */
  rawSubtotal: number;
  /** After the $6,500 minimum-floor and any optimisation discount. */
  finalSubtotalExGst: number;
  originalSubtotal: number;
  originalBracket: BracketSnapshot;
  optimizedSubtotal: number;
  optimizedBracket: BracketSnapshot;
  discountApplied: number;
  optimizationOccurred: boolean;
  optimizationDetails: OptimizationDetails | null;
  financeAdjustedExGst: number;
  gstAmount: number;
  finalIncGst: number;
  repayment: Repayment;
  /** Flags surfaced for Luke's review (line-pump 100m²+, etc.). */
  reviewFlags: string[];
}

// =============================================================================
// Component calculators — one per pricing dimension
// =============================================================================

export function getBaseRate(
  finish: Finish,
  areaSqm: number,
): { description: string; rate: number } {
  switch (finish) {
    case "natural_grey":
      return {
        description: "Natural Grey Concrete",
        rate: PRICING.baseRates.natural_grey,
      };
    case "coloured":
      return { description: "Coloured Concrete", rate: PRICING.baseRates.coloured };
    case "exposed_aggregate": {
      const rates = PRICING.baseRates.exposed_aggregate;
      let rate: number;
      if (areaSqm < 60) rate = rates.range_0_60;
      else if (areaSqm < 100) rate = rates.range_60_100;
      else rate = rates.range_100_plus;
      return { description: "Exposed Aggregate", rate };
    }
    case "pavilion_finish":
      return {
        description: "Pavilion Finish",
        rate: PRICING.baseRates.pavilion_finish,
      };
  }
}

export function calculateExcavation(areaSqm: number): LineItem {
  const base = PRICING.excavation.baseAllowance;
  if (areaSqm <= 65) return { description: "Excavation (0–65m²)", amount: base };

  let cost = base + PRICING.excavation.above_65;
  if (areaSqm >= 120) cost += PRICING.excavation.above_120;
  return { description: "Excavation (65m²+)", amount: cost };
}

export function calculateDemolition(
  areaSqm: number,
  hasRemoval: boolean,
): LineItem {
  if (!hasRemoval)
    return { description: "Demolition (not required)", amount: 0 };

  const base = PRICING.demolition.minimumAllowance;
  if (areaSqm <= 50)
    return { description: "Demolition (0–50m²)", amount: base };

  const above50 = areaSqm - 50;
  const cost = base + above50 * PRICING.demolition.above_50_per_sqm;
  return { description: "Demolition (50m²+)", amount: cost };
}

export function calculateStripDrain(
  drainage: Drainage,
  lengthM?: number,
): LineItem {
  if (drainage === "no")
    return { description: "Strip Drain (not required)", amount: 0 };

  if (drainage === "unsure") {
    return {
      description: "Strip Drain (flagged for review)",
      amount: PRICING.stripDrain.defaultIfUnknown,
    };
  }

  // drainage === "yes"
  if (lengthM === undefined || lengthM <= 6) {
    return {
      description: "Strip Drain (0–6m)",
      amount: PRICING.stripDrain.up_to_6m,
    };
  }
  return {
    description: "Strip Drain (6–10m)",
    amount: PRICING.stripDrain["6_to_10m"],
  };
}

export function calculateSteepness(slope: Slope, areaSqm: number): LineItem {
  if (slope === "flat_minimal")
    return { description: "Steepness (flat/minimal)", amount: 0 };
  if (slope === "moderately_steep") {
    return {
      description: "Steepness (moderately steep)",
      amount: PRICING.steepness.moderately_steep,
    };
  }
  // extremely_steep
  if (areaSqm < 50) {
    return {
      description: "Steepness (extremely steep, <50m²)",
      amount: PRICING.steepness.extremely_steep["25_50"],
    };
  }
  return {
    description: "Steepness (extremely steep, 50m²+)",
    amount: PRICING.steepness.extremely_steep["50_plus"],
  };
}

export function calculatePump(
  slope: Slope,
  areaSqm: number,
): { item: LineItem; reviewFlag?: string } {
  if (slope === "extremely_steep" && areaSqm >= 50) {
    return {
      item: {
        description: "Boom Pump (extremely steep, 50m²+)",
        amount: PRICING.pump.boomPumpCost,
      },
    };
  }
  if (areaSqm > 100) {
    return {
      item: {
        description: "Line Pump (100m²+, flag for review)",
        amount: 0,
      },
      reviewFlag:
        "Line pump may be required for areas over 100m² — confirm on site.",
    };
  }
  return { item: { description: "Pump (not required)", amount: 0 } };
}

// =============================================================================
// HUM brackets + optimisation
// =============================================================================

function bracketSnapshot(b: HumBracket): BracketSnapshot {
  return {
    from: b.from,
    to: b.to,
    fortnights: b.fortnights,
    feePercent: b.fee,
    rangeDesc: formatBracketRange(b.from, b.to),
  };
}

/**
 * Legacy bracket lookup. No longer drives pricing (a flat fee does — see
 * `calculateEstimate`), but kept for forward-compatibility and exercised by
 * the unit tests so the bracket table stays valid if tiers are reintroduced.
 */
export function getHumBracket(amount: number): BracketSnapshot {
  for (const b of PRICING.humBrackets) {
    if (b.from <= amount && amount <= b.to) return bracketSnapshot(b);
  }
  return bracketSnapshot(PRICING.humBrackets[PRICING.humBrackets.length - 1]);
}

// =============================================================================
// Repayments
// =============================================================================

export function calculateRepayments(
  finalIncGst: number,
  fortnights: number,
): Repayment {
  const termWeeks = fortnights * 2;
  const fortnightly = finalIncGst / fortnights;
  const weekly = fortnightly / 2;
  return {
    termWeeks,
    fortnights,
    fortnightly: roundHalfEven(fortnightly, 2),
    weekly: roundHalfEven(weekly, 2),
  };
}

// =============================================================================
// Top-level: compute the full estimate
// =============================================================================

export function calculateEstimate(inputs: PricingInputs): Estimate {
  const { areaSqm, finish, hasRemoval, slope, drainage, stripDrainLengthM } =
    inputs;

  const reviewFlags: string[] = [];

  const base = getBaseRate(finish, areaSqm);
  const baseCost = base.rate * areaSqm;
  const baseItem: LineItem = {
    description: `${base.description}: $${base.rate}/m² × ${areaSqm}m²`,
    amount: baseCost,
  };

  const excavationItem = calculateExcavation(areaSqm);
  const demolitionItem = calculateDemolition(areaSqm, hasRemoval);
  const steepnessItem = calculateSteepness(slope, areaSqm);
  const pumpRes = calculatePump(slope, areaSqm);
  const pumpItem = pumpRes.item;
  if (pumpRes.reviewFlag) reviewFlags.push(pumpRes.reviewFlag);
  const drainItem = calculateStripDrain(drainage, stripDrainLengthM);
  if (drainage === "unsure") {
    reviewFlags.push(
      "Drainage answer was 'unsure' — strip drain estimate carries default 6m allowance, confirm on site.",
    );
  }

  const lineItems: LineItem[] = [
    baseItem,
    excavationItem,
    demolitionItem,
    steepnessItem,
    pumpItem,
    drainItem,
  ];

  const rawSubtotal =
    baseCost +
    excavationItem.amount +
    demolitionItem.amount +
    steepnessItem.amount +
    pumpItem.amount +
    drainItem.amount;

  const flooredSubtotal = Math.max(rawSubtotal, PRICING.minimumProjectPrice);
  if (rawSubtotal < PRICING.minimumProjectPrice) {
    reviewFlags.push(
      `Subtotal lifted to project minimum of $${PRICING.minimumProjectPrice.toLocaleString("en-AU")}.`,
    );
  }

  // Finance: a single flat merchant fee + the maximum repayment term on every
  // quote (replaces the old tiered HUM brackets). The HUM portal lets the
  // customer pick a shorter term later, which only ever costs less — quoting the
  // worst case here (longest term, highest fee) makes the estimate a ceiling,
  // never an under-quote. Bracket optimisation is therefore inert; the bracket
  // table + humOptimization remain in config for forward-compatibility only.
  const financeBracket: BracketSnapshot = {
    from: PRICING.minimumProjectPrice,
    to: 999999,
    fortnights: PRICING.financeTermFortnights,
    feePercent: PRICING.financeFeeRate * 100,
    rangeDesc: "Flat rate",
  };

  const financeAdjustedExGst = flooredSubtotal / (1 - PRICING.financeFeeRate);
  const gstAmount = financeAdjustedExGst * PRICING.gstRate;
  const finalIncGst = financeAdjustedExGst + gstAmount;
  const repayment = calculateRepayments(
    finalIncGst,
    PRICING.financeTermFortnights,
  );

  return {
    inputs,
    lineItems,
    rawSubtotal,
    finalSubtotalExGst: flooredSubtotal,
    originalSubtotal: flooredSubtotal,
    originalBracket: financeBracket,
    optimizedSubtotal: flooredSubtotal,
    optimizedBracket: financeBracket,
    discountApplied: 0,
    optimizationOccurred: false,
    optimizationDetails: null,
    financeAdjustedExGst,
    gstAmount,
    finalIncGst,
    repayment,
    reviewFlags,
  };
}
