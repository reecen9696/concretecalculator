# Quote calculations — Smooth Concrete driveway estimate

Every number and formula behind the estimate, in the order the engine runs them.
All rates live in `src/config/pricing.ts` (Luke can edit that file directly); the
maths lives in `src/lib/pricing.ts`. Figures below are the **current** values.

> **Changed in this version:** the old tiered HUM fee brackets (4%–17.98%) have been
> replaced with a **flat 15% merchant fee on every quote**, and the repayment term is
> now **always the maximum (78 fortnights)**. See Steps 9–10. The bracket-optimisation
> step is retained in config but is inert under a flat rate (Step 11).

> Note on rounding: money uses **banker's rounding** (half-to-even) to 2 decimals,
> to stay cent-for-cent identical to the original Python engine. GST and repayments
> are computed from un-rounded figures, then rounded for display.

---

## The 5 customer inputs that drive the price

1. **Area** (m²) — from total / sum of sections / `0` if "upload plans"
2. **Finish** — natural grey / coloured / exposed aggregate / pavilion
3. **Existing surface removal** — yes / no
4. **Slope** — flat / moderately steep / extremely steep
5. **Drainage** — no / yes (+ optional strip-drain length) / unsure

---

## Step 1 — Base concrete cost = rate × area

| Finish | Rate ($/m²) |
|---|---|
| Natural Grey | **$110** |
| Coloured | **$130** |
| Pavilion Finish | **$150** |
| Exposed Aggregate — area < 60 m² | **$220** |
| Exposed Aggregate — 60 to < 100 m² | **$210** |
| Exposed Aggregate — 100 m²+ | **$190** |

`base cost = rate × area`
(Exposed aggregate is the only finish whose rate changes by size.)

## Step 2 — Excavation (always charged)

| Area | Charge |
|---|---|
| 0 – 65 m² | **$1,500** (base allowance) |
| over 65 m² | $1,500 **+ $500** = $2,000 |
| 120 m²+ | $1,500 + $500 **+ $500** = $2,500 |

## Step 3 — Demolition / removal

| Condition | Charge |
|---|---|
| No removal | **$0** |
| Removal, 0 – 50 m² | **$2,200** (minimum allowance) |
| Removal, over 50 m² | $2,200 **+ $50 × (area − 50)** |

## Step 4 — Steepness

| Slope | Charge |
|---|---|
| Flat / minimal | **$0** |
| Moderately steep | **$500** |
| Extremely steep, < 50 m² | **$1,000** |
| Extremely steep, 50 m²+ | **$0** (cost moves to the pump instead — see Step 5) |

## Step 5 — Pump

| Condition | Charge | Note |
|---|---|---|
| Extremely steep **and** 50 m²+ | **$2,000** (boom pump) | |
| Area over 100 m² (any slope) | **$0** | Flags _"Line pump may be required for areas over 100m² — confirm on site."_ |
| Otherwise | **$0** | |

## Step 6 — Strip drain

| Drainage answer | Charge |
|---|---|
| No | **$0** |
| Yes, length ≤ 6 m (or blank) | **$1,500** |
| Yes, length 6 – 10 m | **$2,000** |
| Unsure | **$1,500** (default) + flags for review |

---

## Step 7 — Raw subtotal (ex GST, ex finance)

`raw subtotal = base + excavation + demolition + steepness + pump + strip drain`

## Step 8 — Minimum project floor

`subtotal = max(raw subtotal, $6,500)`
If the raw subtotal was below $6,500 it's lifted to $6,500 and a review note is added.

---

## Step 9 — Finance fee and term (flat rate)

**This is the changed section.** There are no longer any subtotal brackets. Every quote uses:

| Value | Setting |
|---|---|
| Merchant / finance fee | **15.00%** (flat, all quotes) |
| Repayment term | **78 fortnights** (the maximum / 36 months, all quotes) |

Rationale: in the HUM portal the customer can choose their own term, and the longest
term always surfaces the highest merchant fee. The calculator now always quotes against
that worst case (flat 15%, longest term) so the estimate never comes in under what the
customer can be charged. If they later pick a shorter term in the portal, they simply
pay less — the estimate is the ceiling, not the floor.

Config keys (in `src/config/pricing.ts`):
- `financeFeeRate: 0.15`
- `financeTermFortnights: 78`

## Step 10 — Apply the finance fee (reverse calc)

Unchanged in method — the fee is **added on top** by grossing up, not by multiplying:

`finance-adjusted = subtotal ÷ (1 − fee%)`

With the flat rate: `finance-adjusted = subtotal ÷ (1 − 0.15) = subtotal ÷ 0.85`

Example: $12,500 → 12,500 ÷ 0.85 = **$14,705.88**

## Step 11 — Bracket optimisation (inert)

The old engine could nudge a subtotal **down** into a cheaper-fee bracket to protect
margin. With a single flat 15% rate there are no cheaper brackets to move into, so this
step **no longer does anything**. It is left in place for forward-compatibility only.

- Toggle: `humOptimization.enabled` — **retained in config**.
- Effect under flat rate: **none** (no bracket boundaries exist to optimise across).
- Discount cap `maxDiscountAllowance` ($450) is likewise inert.

If tiered brackets are ever reintroduced, this logic becomes live again without code
changes.

## Step 12 — GST and final price

```
GST           = finance-adjusted × 10%
FINAL inc GST = finance-adjusted + GST     ← this is the "Estimated Project Investment"
```

## Step 13 — Repayments (shown under HUM Finance)

```
fortnightly = FINAL inc GST ÷ 78
weekly      = fortnightly ÷ 2
term weeks  = 78 × 2 = 156 weeks
```

---

## Worked examples (live engine output — flat 15%, 78 fortnights)

### A. Exposed aggregate · 50 m² · no removal · flat · no drainage
| Line | Amount |
|---|---|
| Exposed Aggregate $220/m² × 50 | $11,000.00 |
| Excavation (0–65m²) | $1,500.00 |
| Demolition / steepness / pump / drain | $0.00 |
| **Raw subtotal** | **$12,500.00** |
| Fee / term | 15.00% / 78 fortnights |
| Finance-adjusted (ex GST) = 12,500 ÷ 0.85 | $14,705.88 |
| GST (10%) | $1,470.59 |
| **FINAL inc GST** | **$16,176.47** |
| Repayment | **$103.70/wk** ($207.39/fortnight × 78) |

### B. Natural grey · 30 m² · removal · moderately steep · drainage yes 8 m
| Line | Amount |
|---|---|
| Natural Grey $110/m² × 30 | $3,300.00 |
| Excavation (0–65m²) | $1,500.00 |
| Demolition (0–50m²) | $2,200.00 |
| Steepness (moderately steep) | $500.00 |
| Strip Drain (6–10m) | $2,000.00 |
| **Raw subtotal** | **$9,500.00** |
| Fee / term | 15.00% / 78 fortnights |
| Finance-adjusted (ex GST) = 9,500 ÷ 0.85 | $11,176.47 |
| GST (10%) | $1,117.65 |
| **FINAL inc GST** | **$12,294.12** |
| Repayment | **$78.81/wk** ($157.62/fortnight × 78) |

### C. Tiny job hitting the $6,500 minimum · natural grey · 20 m² · flat
| Line | Amount |
|---|---|
| Natural Grey $110/m² × 20 | $2,200.00 |
| Excavation (0–65m²) | $1,500.00 |
| **Raw subtotal** | **$3,700.00** |
| Lifted to minimum | **$6,500.00** |
| Fee / term | 15.00% / 78 fortnights |
| Finance-adjusted (ex GST) = 6,500 ÷ 0.85 | $7,647.06 |
| GST (10%) | $764.71 |
| **FINAL inc GST** | **$8,411.76** |
| Repayment | **$53.92/wk** ($107.84/fortnight × 78) |
| Note | _Subtotal lifted to project minimum of $6,500._ |

---

## Other constants

- GST rate: **10%**
- Finance fee rate: **15%** (flat)
- Finance term: **78 fortnights** (fixed)
- Minimum project price: **$6,500**
- Optimisation discount cap: **$450** (inert under flat rate)
- "Upload plans" path: area is treated as **0 m²**, so the base cost is $0 and the
  quote almost always lands on the **$6,500 minimum** until measured from the plans.
