import { describe, expect, it } from "vitest";
import { calculateEstimate, getHumBracket } from "./pricing";
import { formatCurrency, roundHalfEven } from "./format";

describe("pricing engine — parity with Python reference", () => {
  it("matches the canonical 50m² exposed-aggregate case", () => {
    const e = calculateEstimate({
      finish: "exposed_aggregate",
      areaSqm: 50,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    });

    expect(formatCurrency(e.lineItems[0].amount)).toBe("$11,000.00");
    expect(formatCurrency(e.originalSubtotal)).toBe("$12,500.00");
    expect(e.originalBracket.feePercent).toBe(17.98);
    expect(formatCurrency(e.financeAdjustedExGst)).toBe("$15,240.19");
    expect(formatCurrency(e.gstAmount)).toBe("$1,524.02");
    expect(formatCurrency(e.finalIncGst)).toBe("$16,764.20");
    expect(e.repayment.fortnights).toBe(78);
    expect(formatCurrency(e.repayment.fortnightly)).toBe("$214.93");
    expect(formatCurrency(e.repayment.weekly)).toBe("$107.46");
  });

  it("triggers optimisation when discount cost < fee savings", () => {
    // 50.5m² natural_grey + excav = $7,055 subtotal (bracket 6).
    // Discounting to $7,000 (bracket 5) costs $55, saves >$300 in merchant fees.
    const e = calculateEstimate({
      finish: "natural_grey",
      areaSqm: 50.5,
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    });
    expect(e.optimizationOccurred).toBe(true);
    expect(e.discountApplied).toBe(55);
    expect(e.optimizedBracket.feePercent).toBe(11.82);
    expect(formatCurrency(e.financeAdjustedExGst)).toBe("$7,938.31");
    expect(formatCurrency(e.finalIncGst)).toBe("$8,732.14");
    expect(e.repayment.fortnights).toBe(52);
    expect(formatCurrency(e.repayment.weekly)).toBe("$83.96");
  });

  it("does not optimise when discount needed exceeds $450", () => {
    // 60m² coloured + excav + demo + slope = $12,500 → bracket 7.
    // Discount to fit bracket 6 ($10k) would need $2,500 → too large.
    const e = calculateEstimate({
      finish: "coloured",
      areaSqm: 60,
      hasRemoval: true,
      slope: "moderately_steep",
      drainage: "no",
    });
    expect(e.optimizationOccurred).toBe(false);
    expect(e.originalBracket.feePercent).toBe(17.98);
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
