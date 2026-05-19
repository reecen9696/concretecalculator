"""
Pricing parity reference runner.

Runs the same six cases as scripts/pricing-parity.ts against the original
Python engine in originalcalc/, in the same output format. Use:

    python3 scripts/pricing-parity-reference.py > /tmp/py-parity.out
    npm run parity > /tmp/ts-parity.out
    diff /tmp/py-parity.out /tmp/ts-parity.out

Identical output is the parity gate.
"""

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "originalcalc" / "backend"))

from pricing_engine import PricingEngine  # noqa: E402

engine = PricingEngine(
    config_path=str(REPO_ROOT / "originalcalc" / "config" / "pricing.yaml")
)


def run(label, finish, area_sqm, has_removal, slope, drainage, strip_drain_length=None):
    base_desc, base_rate = engine.get_base_rate(finish, area_sqm)
    base_cost = base_rate * area_sqm

    excavation_desc, excavation_cost = engine.calculate_excavation(area_sqm)
    demolition_desc, demolition_cost = engine.calculate_demolition(area_sqm, has_removal)
    steepness_desc, steepness_cost = engine.calculate_steepness(slope, area_sqm)
    pump_desc, pump_cost = engine.calculate_pump(slope, area_sqm)
    drain_desc, drain_cost = engine.calculate_strip_drain(drainage, strip_drain_length)

    raw_subtotal = base_cost + excavation_cost + demolition_cost + steepness_cost + pump_cost + drain_cost

    # Mirror the new TS engine's review-flag and floor-lift behaviour.
    review_flags = []
    if drainage == "unsure":
        review_flags.append(
            "Drainage answer was 'unsure' — strip drain estimate carries default 6m allowance, confirm on site."
        )
    if pump_desc.startswith("Line Pump"):
        review_flags.append(
            "Line pump may be required for areas over 100m² — confirm on site."
        )

    floored_subtotal = max(raw_subtotal, engine.config["minimum_project_price"])
    if raw_subtotal < engine.config["minimum_project_price"]:
        review_flags.append(
            f"Subtotal lifted to project minimum of ${engine.config['minimum_project_price']:,}."
        )

    calc = engine.calculate_with_optimization(floored_subtotal)
    repayment = engine.calculate_repayments(
        calc["final_inc_gst"], calc["optimized_bracket"]["fortnights"]
    )

    print(f"\n=== {label} ===")
    print(f"{base_desc}: {base_rate}/m² × {area_sqm}m² = ${base_cost:,.2f}")
    print(f"{excavation_desc}: ${excavation_cost:,.2f}")
    print(f"{demolition_desc}: ${demolition_cost:,.2f}")
    print(f"{steepness_desc}: ${steepness_cost:,.2f}")
    print(f"{pump_desc}: ${pump_cost:,.2f}")
    print(f"{drain_desc}: ${drain_cost:,.2f}")
    print(f"\nSubtotal (ex GST, ex finance): ${floored_subtotal:,.2f}")
    print(
        f"Original bracket: {calc['original_bracket']['range_desc']} @ {calc['original_bracket']['fee_percent']}%"
    )

    if calc["optimization_occurred"]:
        print(f"\n*** OPTIMIZED ***")
        print(
            f"Optimized bracket: {calc['optimized_bracket']['range_desc']} @ {calc['optimized_bracket']['fee_percent']}%"
        )
        print(f"Discount applied: ${calc['discount_applied']:,.2f}")
        print(f"Fee savings: ${calc['optimization_details']['fee_savings']:,.2f}")

    print(f"\nFinance-adjusted (ex GST): ${calc['finance_adjusted_ex_gst']:,.2f}")
    print(f"GST (10%): ${calc['gst_amount']:,.2f}")
    print(f"Final (inc GST): ${calc['final_inc_gst']:,.2f}")

    print(
        f"\nRepayment ({repayment['fortnights']} fortnights / {repayment['term_weeks']} weeks):"
    )
    print(f"  Fortnightly: ${repayment['fortnightly']:,.2f}")
    print(f"  Weekly: ${repayment['weekly']:,.2f}")

    if review_flags:
        print(f"\nReview flags:")
        for f in review_flags:
            print(f"  - {f}")


cases = [
    ("Test Calculation (matches Python __main__)", "exposed_aggregate", 50, False, "flat_minimal", "no", None),
    ("Optimization trigger (60m² coloured, removal, moderate slope)", "coloured", 60, True, "moderately_steep", "no", None),
    ("Optimization trigger (small job just above $7,000)", "natural_grey", 50.5, False, "flat_minimal", "no", None),
    ("Bracket boundary ($7,000.00 exact → bracket 5; $7,000.01 → bracket 6)", "natural_grey", 50, False, "flat_minimal", "no", None),
    ("Minimum-floor case (tiny job lifts to $6,500)", "natural_grey", 10, False, "flat_minimal", "no", None),
    ("Extreme slope, large job (boom pump triggers)", "exposed_aggregate", 80, False, "extremely_steep", "no", None),
]

for label, *args in cases:
    run(label, *args)
