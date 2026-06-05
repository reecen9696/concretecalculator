import { describe, expect, it } from "vitest";
import { calculateEstimate, getHumBracket } from "./pricing";
import { formatCurrency, roundHalfEven } from "./format";

describe("pricing engine — flat finance fee + fixed term", () => {
  it("matches the canonical 50m² exposed-aggregate case (flat 15%, 78 fortnights)", () => {
    const e = calculateEstimate({
      finish: "exposed_aggregate",
      areaSqm: 50,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    });

    expect(formatCurrency(e.lineItems[0].amount)).toBe("$11,000.00");
    expect(formatCurrency(e.originalSubtotal)).toBe("$12,500.00");
    expect(e.originalBracket.feePercent).toBe(15);
    expect(formatCurrency(e.financeAdjustedExGst)).toBe("$14,705.88");
    expect(formatCurrency(e.gstAmount)).toBe("$1,470.59");
    expect(formatCurrency(e.finalIncGst)).toBe("$16,176.47");
    expect(e.repayment.fortnights).toBe(78);
    expect(formatCurrency(e.repayment.fortnightly)).toBe("$207.39");
    expect(formatCurrency(e.repayment.weekly)).toBe("$103.70");
  });

  it("applies the flat fee with no bracket optimisation (former optimisation case)", () => {
    // 50.5m² natural_grey + excav = $7,055 subtotal. Under the old tiered
    // brackets this nudged down a bracket; under a flat 15% there are no
    // brackets to optimise across, so the fee/term are constant.
    const e = calculateEstimate({
      finish: "natural_grey",
      areaSqm: 50.5,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    });
    expect(e.optimizationOccurred).toBe(false);
    expect(e.discountApplied).toBe(0);
    expect(e.optimizedBracket.feePercent).toBe(15);
    expect(formatCurrency(e.financeAdjustedExGst)).toBe("$8,300.00");
    expect(formatCurrency(e.finalIncGst)).toBe("$9,130.00");
    expect(e.repayment.fortnights).toBe(78);
    expect(formatCurrency(e.repayment.weekly)).toBe("$58.53");
  });

  it("never optimises — fee and term are flat regardless of subtotal", () => {
    const e = calculateEstimate({
      finish: "coloured",
      areaSqm: 60,
      hasRemoval: true,
      slope: "moderately_steep",
      drainage: "no",
    });
    expect(e.optimizationOccurred).toBe(false);
    expect(e.originalBracket.feePercent).toBe(15);
    expect(e.repayment.fortnights).toBe(78);
  });

  it("applies the $6,500 minimum-floor to tiny jobs and flags it", () => {
    const e = calculateEstimate({
      finish: "natural_grey",
      areaSqm: 10,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    });
    expect(e.originalSubtotal).toBe(6500);
    expect(e.reviewFlags.some((f) => f.includes("project minimum"))).toBe(true);
  });

  it("treats $7,000 as bracket 5 and $7,000.01 as bracket 6", () => {
    expect(getHumBracket(7000).feePercent).toBe(11.82);
    expect(getHumBracket(7000.01).feePercent).toBe(14.95);
  });

  it("triggers boom pump on extreme slope ≥50m²", () => {
    const e = calculateEstimate({
      finish: "exposed_aggregate",
      areaSqm: 80,
      hasRemoval: false,
      slope: "extremely_steep",
      drainage: "no",
    });
    const pump = e.lineItems.find((li) => li.description.startsWith("Boom Pump"));
    expect(pump?.amount).toBe(2000);
  });
});

describe("rounding helper (Python banker's rounding parity)", () => {
  it("rounds half to even at exact halves", () => {
    expect(roundHalfEven(0.5, 0)).toBe(0);
    expect(roundHalfEven(1.5, 0)).toBe(2);
    expect(roundHalfEven(2.5, 0)).toBe(2);
    expect(roundHalfEven(0.245, 2)).toBe(0.24);
    expect(roundHalfEven(0.255, 2)).toBe(0.26);
  });
  it("rounds half-up cases the same as Math.round", () => {
    expect(roundHalfEven(214.9257, 2)).toBe(214.93);
    expect(roundHalfEven(107.4628, 2)).toBe(107.46);
  });
});
