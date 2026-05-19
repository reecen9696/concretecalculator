/**
 * Pricing parity script — prints output in the same shape as
 * originalcalc/backend/pricing_engine.py's __main__ block, plus extra cases
 * that exercise optimisation, bracket boundaries, and the project minimum.
 *
 * The intent is that you can run this and visually diff against the Python
 * reference to confirm cent-for-cent parity.
 *
 *     npm run parity
 *
 * The "official" reference case (50m² exposed aggregate, flat, no removal,
 * no drain) is the first block, identical to Python's __main__.
 */

import {
  calculateEstimate,
  getBaseRate,
  type PricingInputs,
} from "../src/lib/pricing";
import { formatCurrency } from "../src/lib/format";

interface Case {
  label: string;
  inputs: PricingInputs;
}

const cases: Case[] = [
  {
    label: "Test Calculation (matches Python __main__)",
    inputs: {
      finish: "exposed_aggregate",
      areaSqm: 50,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    },
  },
  {
    label: "Optimization trigger (60m² coloured, removal, moderate slope)",
    // base 130 × 60 = 7800; +excav 65m²+ 2000; +demo 0–50 2200 (wait area 60 → +500 above 50 = 2700)
    // Actually demolition above 50: 2200 + (60-50)*50 = 2700
    // Subtotal = 7800 + 2000 + 2700 + 500 (mod slope) + 0 + 0 = 13000 → bracket $10k–$15k
    // Should NOT trigger optimisation (discount needed = 3000, > max 450).
    inputs: {
      finish: "coloured",
      areaSqm: 60,
      hasRemoval: true,
      slope: "moderately_steep",
      drainage: "no",
    },
  },
  {
    label: "Optimization trigger (small job just above $7,000)",
    // natural_grey 110 × 50 = 5500; +excav 1500; +0 demo; +0 slope; +0 pump; +0 drain → 7000 (exactly)
    // Lands in bracket 5 ($5000.01–$7000) — no optimisation possible (already lowest viable).
    // Push to 60m²: 110×60=6600 + excav 65m²+ 2000 = 8600 + 0 + 0 + 0 + 0 = 8600 → bracket 6.
    // Discount needed = 8600-7000 = 1600 > 450 → no opt.
    // Hand-craft a case at $7,200 subtotal: 51m² natural_grey (5610) + excav 2000 → 7610. Discount 610 > 450.
    // 50m² natural_grey 5500 + excav 1500 + drain unsure 1500 = 8500 → bracket 6. Discount 1500 > 450.
    // 50m² natural_grey + drain "yes ≤6m" $1500 = 5500+1500+1500 = 8500. Same.
    // 64m² natural_grey = 7040 + excav 1500 = 8540 → discount 1540.
    // Let's design one: want subtotal just above 7000 by ≤450, i.e. 7000-7450.
    // 50m² natural_grey 5500 + excav 1500 + drain "no" 0 = 7000 exactly (bracket 5, no opt).
    // 51m² natural_grey 5610 + excav 65m²+ 2000 = 7610. 610 over 7000 → just outside the $450 window.
    // 50m² natural_grey 5500 + excav 1500 + 0 demo + 0 slope + 0 pump + drain yes-≤6m 1500 = 8500. 1500 over.
    // 50m² natural_grey 5500 + excav 1500 + steepness moderate 500 = 7500. 500 over → just outside.
    // 50m² natural_grey 5500 + excav 1500 + steepness moderate 500 (= 7500) — but we want ≤7450.
    // 50m² coloured 6500 + excav 1500 = 8000 → discount 1000 > 450.
    // Try area = 50, finish=natural_grey, removal=no, slope=flat, drainage=unsure (1500) → 5500+1500+0+0+0+1500=8500.
    // Try finish=natural_grey, area=50.5m²: 5555 + 1500 = 7055. Discount needed 55 ≤ 450. Bracket 6 (14.95%).
    //   fee_savings = 7055/(1-0.1495) - 7000/(1-0.1182) = 8295.71 - 7938.31 = 357.40
    //   net = 357.40 - 55 = 302.40 → OPTIMISES.
    inputs: {
      finish: "natural_grey",
      areaSqm: 50.5,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    },
  },
  {
    label: "Bracket boundary ($7,000.00 exact → bracket 5; $7,000.01 → bracket 6)",
    inputs: {
      // 50m² natural_grey + 65m²-excav 1500 = 5500 + 1500 = 7000 exact. Bracket 5.
      finish: "natural_grey",
      areaSqm: 50,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    },
  },
  {
    label: "Minimum-floor case (tiny job lifts to $6,500)",
    // 10m² natural_grey = 1100, + excav 1500 = 2600. Floor → $6,500 (bracket 5).
    inputs: {
      finish: "natural_grey",
      areaSqm: 10,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    },
  },
  {
    label: "Extreme slope, large job (boom pump triggers)",
    // 80m² exposed_aggregate (60-100 tier $210): 16800
    // + excav 65m²+ 2000 + 0 demo + steep 0 (extreme + ≥50m²) + boom pump 2000 + drain 0 = 20800
    inputs: {
      finish: "exposed_aggregate",
      areaSqm: 80,
      hasRemoval: false,
      slope: "extremely_steep",
      drainage: "no",
    },
  },
];

function printEstimate(label: string, inputs: PricingInputs) {
  const e = calculateEstimate(inputs);
  console.log(`\n=== ${label} ===`);
  // Mirror the Python __main__ printout for the first case.
  // Match Python __main__ printout exactly:
  //   first line: "<finish>: <rate>/m² × <area>m² = $<base_cost>"
  const base = getBaseRate(inputs.finish, inputs.areaSqm);
  const baseCost = base.rate * inputs.areaSqm;
  console.log(
    `${base.description}: ${base.rate}/m² × ${inputs.areaSqm}m² = ${formatCurrency(baseCost)}`,
  );
  for (let i = 1; i < e.lineItems.length; i++) {
    const li = e.lineItems[i];
    console.log(`${li.description}: ${formatCurrency(li.amount)}`);
  }
  console.log(
    `\nSubtotal (ex GST, ex finance): ${formatCurrency(e.originalSubtotal)}`,
  );
  console.log(
    `Original bracket: ${e.originalBracket.rangeDesc} @ ${e.originalBracket.feePercent}%`,
  );

  if (e.optimizationOccurred && e.optimizationDetails) {
    console.log(`\n*** OPTIMIZED ***`);
    console.log(
      `Optimized bracket: ${e.optimizedBracket.rangeDesc} @ ${e.optimizedBracket.feePercent}%`,
    );
    console.log(`Discount applied: ${formatCurrency(e.discountApplied)}`);
    console.log(
      `Fee savings: ${formatCurrency(e.optimizationDetails.feeSavings)}`,
    );
  }

  console.log(
    `\nFinance-adjusted (ex GST): ${formatCurrency(e.financeAdjustedExGst)}`,
  );
  console.log(`GST (10%): ${formatCurrency(e.gstAmount)}`);
  console.log(`Final (inc GST): ${formatCurrency(e.finalIncGst)}`);

  console.log(
    `\nRepayment (${e.repayment.fortnights} fortnights / ${e.repayment.termWeeks} weeks):`,
  );
  console.log(`  Fortnightly: ${formatCurrency(e.repayment.fortnightly)}`);
  console.log(`  Weekly: ${formatCurrency(e.repayment.weekly)}`);

  if (e.reviewFlags.length > 0) {
    console.log(`\nReview flags:`);
    for (const f of e.reviewFlags) console.log(`  - ${f}`);
  }
}

for (const c of cases) printEstimate(c.label, c.inputs);
