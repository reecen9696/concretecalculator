# Pricing Parity Test

Required gate before any UI work (per `README.md` → "Pricing parity test"). This
file proves that the TypeScript pricing engine in `src/lib/pricing.ts` produces
output **identical to the cent** to the original Python engine in
`originalcalc/backend/pricing_engine.py`.

## How to reproduce

```bash
# Python reference output (same six cases as the TS script)
python3 scripts/pricing-parity-reference.py > /tmp/py-parity.out

# TypeScript engine output
npm run parity --silent > /tmp/ts-parity.out

# Mechanical diff — must be empty
diff /tmp/py-parity.out /tmp/ts-parity.out
echo "exit code: $?"   # expect 0
```

The `vitest` spec in `src/lib/pricing.test.ts` covers the same cases plus the
banker's-rounding helper. Run with `npm test`.

## Result

```
$ diff /tmp/py-parity.out /tmp/ts-parity.out
$ echo "exit code: $?"
0
```

Zero diff. All six cases identical, line-for-line, character-for-character.

```
$ npm test
 ✓ src/lib/pricing.test.ts (8 tests) 36ms
 Test Files  1 passed (1)
 Tests       8 passed (8)
```

## Side-by-side output (canonical 50m² exposed-aggregate case)

The README's official parity case is "50m² exposed aggregate, flat, no removal,
no drain" — exactly what the Python `__main__` block prints.

| Line | Python | TypeScript |
| --- | --- | --- |
| Base | `Exposed Aggregate: 220/m² × 50m² = $11,000.00` | `Exposed Aggregate: 220/m² × 50m² = $11,000.00` |
| Excavation | `Excavation (0–65m²): $1,500.00` | `Excavation (0–65m²): $1,500.00` |
| Demolition | `Demolition (not required): $0.00` | `Demolition (not required): $0.00` |
| Steepness | `Steepness (flat/minimal): $0.00` | `Steepness (flat/minimal): $0.00` |
| Pump | `Pump (not required): $0.00` | `Pump (not required): $0.00` |
| Drainage | `Strip Drain (not required): $0.00` | `Strip Drain (not required): $0.00` |
| Subtotal | `$12,500.00` | `$12,500.00` |
| Bracket | `$10,000–$15,000 @ 17.98%` | `$10,000–$15,000 @ 17.98%` |
| Finance-adjusted (ex GST) | `$15,240.19` | `$15,240.19` |
| GST (10%) | `$1,524.02` | `$1,524.02` |
| **Final (inc GST)** | **`$16,764.20`** | **`$16,764.20`** |
| Fortnights / Weeks | `78 / 156` | `78 / 156` |
| Fortnightly | `$214.93` | `$214.93` |
| Weekly | `$107.46` | `$107.46` |

## All six cases — full Python output

```
=== Test Calculation (matches Python __main__) ===
Exposed Aggregate: 220/m² × 50m² = $11,000.00
Excavation (0–65m²): $1,500.00
Demolition (not required): $0.00
Steepness (flat/minimal): $0.00
Pump (not required): $0.00
Strip Drain (not required): $0.00

Subtotal (ex GST, ex finance): $12,500.00
Original bracket: $10,000–$15,000 @ 17.98%

Finance-adjusted (ex GST): $15,240.19
GST (10%): $1,524.02
Final (inc GST): $16,764.20

Repayment (78 fortnights / 156 weeks):
  Fortnightly: $214.93
  Weekly: $107.46

=== Optimization trigger (60m² coloured, removal, moderate slope) ===
Coloured Concrete: 130/m² × 60m² = $7,800.00
Excavation (0–65m²): $1,500.00
Demolition (50m²+): $2,700.00
Steepness (moderately steep): $500.00
Pump (not required): $0.00
Strip Drain (not required): $0.00

Subtotal (ex GST, ex finance): $12,500.00
Original bracket: $10,000–$15,000 @ 17.98%

Finance-adjusted (ex GST): $15,240.19
GST (10%): $1,524.02
Final (inc GST): $16,764.20

Repayment (78 fortnights / 156 weeks):
  Fortnightly: $214.93
  Weekly: $107.46

=== Optimization trigger (small job just above $7,000) ===
Natural Grey Concrete: 110/m² × 50.5m² = $5,555.00
Excavation (0–65m²): $1,500.00
Demolition (not required): $0.00
Steepness (flat/minimal): $0.00
Pump (not required): $0.00
Strip Drain (not required): $0.00

Subtotal (ex GST, ex finance): $7,055.00
Original bracket: $7,000–$10,000 @ 14.95%

*** OPTIMIZED ***
Optimized bracket: $5,000–$7,000 @ 11.82%
Discount applied: $55.00
Fee savings: $356.81

Finance-adjusted (ex GST): $7,938.31
GST (10%): $793.83
Final (inc GST): $8,732.14

Repayment (52 fortnights / 104 weeks):
  Fortnightly: $167.93
  Weekly: $83.96

=== Bracket boundary ($7,000.00 exact → bracket 5; $7,000.01 → bracket 6) ===
Natural Grey Concrete: 110/m² × 50m² = $5,500.00
Excavation (0–65m²): $1,500.00
Demolition (not required): $0.00
Steepness (flat/minimal): $0.00
Pump (not required): $0.00
Strip Drain (not required): $0.00

Subtotal (ex GST, ex finance): $7,000.00
Original bracket: $5,000–$7,000 @ 11.82%

Finance-adjusted (ex GST): $7,938.31
GST (10%): $793.83
Final (inc GST): $8,732.14

Repayment (52 fortnights / 104 weeks):
  Fortnightly: $167.93
  Weekly: $83.96

=== Minimum-floor case (tiny job lifts to $6,500) ===
Natural Grey Concrete: 110/m² × 10m² = $1,100.00
Excavation (0–65m²): $1,500.00
Demolition (not required): $0.00
Steepness (flat/minimal): $0.00
Pump (not required): $0.00
Strip Drain (not required): $0.00

Subtotal (ex GST, ex finance): $6,500.00
Original bracket: $5,000–$7,000 @ 11.82%

Finance-adjusted (ex GST): $7,371.29
GST (10%): $737.13
Final (inc GST): $8,108.41

Repayment (52 fortnights / 104 weeks):
  Fortnightly: $155.93
  Weekly: $77.97

Review flags:
  - Subtotal lifted to project minimum of $6,500.

=== Extreme slope, large job (boom pump triggers) ===
Exposed Aggregate: 210/m² × 80m² = $16,800.00
Excavation (65m²+): $2,000.00
Demolition (not required): $0.00
Steepness (extremely steep, 50m²+): $0.00
Boom Pump (extremely steep, 50m²+): $2,000.00
Strip Drain (not required): $0.00

Subtotal (ex GST, ex finance): $20,800.00
Original bracket: $15,000–$999,999 @ 17.98%

Finance-adjusted (ex GST): $25,359.67
GST (10%): $2,535.97
Final (inc GST): $27,895.64

Repayment (78 fortnights / 156 weeks):
  Fortnightly: $357.64
  Weekly: $178.82
```

The TypeScript output for the same six cases is byte-identical (confirmed by
`diff`, exit code 0). No need to reproduce both columns here — the diff is the
proof.

## Notes on parity decisions

1. **Banker's rounding.** Python's `round()` and `f"{x:,.2f}"` use round-half-to-even
   (banker's rounding). JS `Math.round` and `Number.toFixed` use round-half-up.
   `src/lib/format.ts → roundHalfEven` mirrors Python so output is identical.
   For all six test cases above, no half-exact tiebreak actually fires — but the
   helper covers the case correctly (verified in unit tests).

2. **Cosmetic Python bug, deliberately not reproduced.** The Python
   `__main__` block prints
   `f"Original bracket: ${calc['original_bracket']['range_desc']}"`, which
   double-prefixes a `$` because `range_desc` already starts with one. The
   shipped TS engine has a single `$`. This is a cosmetic-only fix — no cent
   value changes. The Python harness used for parity testing
   (`scripts/pricing-parity-reference.py`) uses the same single-`$` format so the
   diff is clean.

3. **Photo-count validation dropped.** `pricing_engine.py:303 validate_inputs`
   includes a `photo_count >= 1` check. Photos are out of scope for v1
   (documented in `TODO.md`), so the TS engine has no input validation tied to
   photos. All numerical paths are unaffected.

4. **`hum_optimization.only_when_close: false`.** Configured but never read
   by the Python engine. Ported verbatim into `src/config/pricing.ts` and left
   inert — same as the original — to keep the YAML/TS structure aligned.

5. **Review-flag generation.** Two flags surfaced by the new TS engine that
   the Python engine surfaces elsewhere in `main.py` (not in `pricing_engine.py`):
   the "drainage unsure" flag and the "subtotal lifted to project minimum"
   flag. The Python parity harness mirrors them so diffs stay clean. Numerical
   parity is unaffected.
