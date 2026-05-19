# Smooth Concrete Driveway Calculator — Premium Rebuild

## Project Overview

You are rebuilding the Smooth Concrete driveway estimate calculator from scratch with a dramatically simpler architecture than the original. Three goals:

1. **Premium visual design** — match the landing page it embeds into (Melbourne residential builder, dark hero photo, orange `#FF6600` accents).
2. **New eligibility step** — gate users through a HUM Finance pre-check, branching to either the HUM portal (accepted) or a polite rejection screen + email (rejected).
3. **Embeddable** — deploys as a standalone web app, iframe-embedded into a **WordPress landing page built with Elementor Pro**.

The original calculator lives in `/originalcalc/` — **read-only reference**. Port the pricing math faithfully; rebuild everything else fresh.

---

## Architecture — Read This First

The original implementation uses a full Python FastAPI backend. **We are deliberately not doing that.** Instead:

```
┌─────────────────────────────────────────────────────────┐
│  Static frontend SPA (React + Vite + TS + Tailwind)     │
│                                                          │
│  • All form state, validation, multi-step routing       │
│  • All pricing calculation (ported from pricing_engine) │
│  • HUM bracket selection + optimisation                 │
│  • Eligibility decision logic                           │
│  • GST + repayment calculation                          │
│  • Premium UI, animations, all UX                       │
└────────────────────┬────────────────────────────────────┘
                     │ POST final results
                     ▼
┌─────────────────────────────────────────────────────────┐
│  ONE serverless function: /api/submit                   │
│                                                          │
│  • Receives final submission (calc already done)         │
│  • Sends inquiry email to Luke via Resend               │
│  • Sends rejection email to customer (if rejected)      │
│  • Returns 200 OK                                       │
└─────────────────────────────────────────────────────────┘
```

That's the entire system. No database. No file storage. No photo uploads in v1. No persistent logs — Luke's inbox is the log.

**Why a serverless function and not pure-frontend email?** Email-sending requires a secret API key. If you put that key in browser JS, anyone viewing the page source can spam emails from Luke's account. The function exists solely to hold the secret and forward the email.

---

## Reference Material — Read These First

From `/originalcalc/` (READ-ONLY — do not modify):

- `originalcalc/backend/pricing_engine.py` — **calculation engine. All pricing math must be ported exactly.** Read carefully.
- `originalcalc/config/pricing.yaml` — all rates, HUM brackets, fees. Port verbatim into a TypeScript config file.
- `originalcalc/frontend/index.html` — existing 8-step wizard. Source of UX flow, form fields, validation rules, copy. UI is utilitarian — improve it, don't copy it.
- `originalcalc/backend/main.py` — FastAPI endpoints + email pipeline. Reference for the email HTML template Luke currently receives (in `build_inquiry_email`).
- `originalcalc/MASTER_IMPLEMENTATION_SUMMARY.docx` — full audit, if available.

---

## Customer Journey

In order:

1. **Customer details** — name, phone, email, suburb/postcode
2. **🆕 Finance eligibility check** — see "Eligibility Step" below
3. **Branch**: eligible → continue · rejected → exit flow with thank-you screen
4. **Area measurement** — total m², per-section L×W, or "I'll send measurements via email" (was "upload plans" — no photo handling in v1)
5. **Concrete finish** — natural grey / coloured / exposed aggregate / pavilion
6. **Existing surface removal** — yes / no
7. **Slope** — flat-minimal / moderately steep / extremely steep
8. **Drainage** — no / yes (with strip-drain length) / unsure
9. **Estimate display** — final inc-GST price + weekly + fortnightly repayment (on the HUM-bracket-assigned term, e.g. 52 fortnights for a $6,500 job, 65 for $7–10k, 78 for $10k+)
10. **Continue to HUM Finance** — send inquiry email to Luke + redirect to HUM portal

**No photo upload step in v1.** If Luke wants photos for a specific lead, he replies to the inquiry email requesting them. This is documented in `TODO.md` as a v1.1 add-back if needed.

---

## Eligibility Step (NEW — Insert Between Step 1 and Step 4)

### Placeholder questions

Luke is providing the real eligibility criteria Monday. Build with placeholders, marking every one with a `TODO` comment:

```
TODO: Replace placeholder eligibility questions with Luke's documented
HUM Finance criteria (received Monday).
```

Placeholder questions:
- Are you an Australian resident or permanent visa holder? (yes / no)
- Annual household income — dropdown: `<$30k`, `$30–60k`, `$60–100k`, `$100k+`
- Employment status — full-time / part-time / casual / self-employed / unemployed
- Have you declared bankruptcy in the last 5 years? (yes / no)

### Placeholder eligibility rule

```
TODO: Replace with Luke's actual eligibility logic.
Current placeholder: eligible if ALL of...
  - resident === "yes"
  - income !== "<$30k"
  - employment !== "unemployed"
  - bankruptcy === "no"
```

### Branch behavior

**Eligible** → Continue through remaining steps. On the final estimate screen, the primary CTA is **"Continue to HUM Finance →"**:
1. POST submission to `/api/submit` with `outcome: "eligible"` — sends Luke the full inquiry email
2. On success, redirect to `https://hum.com.au/apply?ref=smoothconcrete` (`TODO: Replace with actual HUM portal URL on Monday`)

**Rejected** → Skip remaining steps. Show a polite screen:
- Heading: **"Thanks {name} — we've got your details."**
- Body: "A member of our team will be in touch within 24 hours. We've also sent you an email about alternative payment options."

On rejection, POST to `/api/submit` with `outcome: "rejected"` — the function sends two emails:
1. To Luke: subject `"REJECTED inquiry — {name}, manual follow-up"`, includes customer details + which criteria failed
2. To customer: rejection-explanation email (`TODO: Replace placeholder customer rejection email copy with Luke's exact copy on Monday`)

---

## Pricing Logic — Port Exactly to TypeScript

**Every calculation comes from `originalcalc/backend/pricing_engine.py`. Port to TypeScript faithfully — do not improvise, simplify, or "improve" it.**

| Component | Behaviour |
|-----------|-----------|
| Base rate | Per `pricing.yaml` — varies by finish + area (exposed aggregate has tiered pricing) |
| Excavation | Tiered: ≤65m², 65–120m², ≥120m² |
| Demolition | $2,200 base + $50/m² above 50m², only if removal = yes |
| Steepness | Flat = $0, moderate = $500, extreme <50m² = $1,000, extreme ≥50m² = $0 (pump handles it) |
| Pump | Boom pump $2,000 only if extreme + ≥50m²; otherwise $0 |
| Strip drain | No = $0, unsure = $1,500 flagged, yes ≤6m = $1,500, yes >6m = $2,000 |
| Minimum project | $6,500 floor |
| HUM brackets | 7 tiers from $80 → $15k+, fee % per `pricing.yaml` |
| HUM fee | **Reverse calc**: `finance_adjusted = subtotal / (1 - fee_decimal)` |
| Optimisation | If discount ≤ $450 moves user to lower bracket AND fee savings > discount → apply it |
| GST | 10%, applied to finance-adjusted amount |
| Display | Weekly + fortnightly repayments on the HUM-bracket-assigned term (NOT hardcoded to 65 fortnights — show the actual term for the customer's bracket) |

### Pricing parity test (CRITICAL — do this before any UI work)

1. Run `python originalcalc/backend/pricing_engine.py` and capture its output (the 50m² exposed aggregate test at the bottom of the file).
2. Build your TypeScript pricing engine.
3. Write an equivalent test in TypeScript with the same inputs.
4. Run it. **Output must match the Python output to the cent.**
5. Capture both outputs side-by-side in `PRICING_TEST.md`.

If the numbers don't match, nothing else matters. Fix the math first.

---

## Design Requirements

### Embed dimensions

The calculator iframes into the hero of a **WordPress page built with Elementor Pro** (specifically, dropped into an Elementor "HTML" widget). The current LP is at `interestfreedriveway.uprisedigital.io`. Available slot is **~380px wide** (it replaces an existing "Get A Instant Estimate" form sitting in the right column of the hero).

- **Width**: max-content 360–380px (account for iframe borders/padding)
- **Height**: design at **720px** (recommend this iframe height in `DEPLOYMENT_NOTES.md`)
- **Mobile**: must work at 360px viewport
- **Wider slots**: should scale up gracefully without stretching awkwardly

### Visual context (the LP)

- Dark suburban-aerial photo background
- Orange brand: `#FF6600` (accent, not background)
- White headline: *"Premium concrete driveways. Pay from as little as $89/week."*
- Trust signals row: "5.0 Google Rating", "15+ Years Experience", "1,000+ Projects Completed"
- Tone: bold, residential-premium, trades/builder — **not** SaaS, not tech-y

### Visual direction — propose one in your plan, get sign-off before building

1. **Glassmorphism** — semi-transparent dark surface with `backdrop-filter: blur(20px)`, orange focus accents
2. **Solid dark** — opaque dark card (`#1a1a1a` → `#2a2a2a` gradient), 1px orange-tinted border, soft outer shadow
3. **Inverse light** — cream/off-white card with charcoal text and orange accents — high contrast against dark hero

### Typography

- System font stack OR Inter via Google Fonts
- H1 generous size + letter-spacing, body 14–16px, helper text 12–13px
- Headings: heavier weight (600–700), tighter line-height
- Currency: tabular-nums for alignment

### Microinteractions

- Step transitions: 300–400ms ease-out, subtle fade + translateY (Framer Motion)
- Active inputs: orange focus ring (`0 0 0 3px rgba(255, 102, 0, 0.2)`)
- Buttons: hover lift (translateY -2px) + soft shadow, active press-in
- Radio/checkbox cards: hover border glow, selected state filled
- Progress bar: smooth animated fill
- Loading state during `/api/submit` POST

### Premium polish details

- Real currency formatting: `$24,856.00`, never `$24856`
- Generous padding — don't cram
- Consistent rounded corners: 12px on cards, 8px on inputs/buttons
- **No emoji in customer-facing UI** — use Lucide icons or inline SVGs
- Subtle gradient or texture on dark surfaces (avoid flat black)
- Inline form errors below fields, never popups

---

## Tech Stack

**Use this exact stack unless you have a strong reason to deviate:**

- **Vite + React + TypeScript** — static SPA, deploys anywhere
- **Tailwind CSS** — styling
- **shadcn/ui** — form primitives (Input, Select, RadioGroup, Button)
- **Framer Motion** — step transitions and microinteractions
- **Lucide React** — icons
- **Resend** — email API (https://resend.com)
- **Vercel** — hosting (frontend + serverless function in one deployment)

Rationale:
- Static SPA = zero server to manage, fastest possible load
- Vercel deploys the SPA and the `/api/submit` function from one repo
- Resend has a clean SDK, free tier of 100 emails/day (plenty for inquiry volume)
- TypeScript catches bugs in the pricing port

### The serverless function

Single file: `api/submit.ts` (Vercel convention — files in `/api/` become serverless functions automatically).

Responsibilities:
- Validates the POST body shape (use Zod or similar)
- Branches on `outcome`: `"eligible"` (one email to Luke) or `"rejected"` (one to Luke, one to customer)
- Uses Resend SDK to send emails
- Returns `{ success: true }` or `{ success: false, error }`

That's it. ~50–80 lines of code total. Mirror the inquiry email HTML structure from `originalcalc/backend/main.py` `build_inquiry_email` — Luke is used to that format.

---

## Configuration

### Pricing config

Port `originalcalc/config/pricing.yaml` to `src/config/pricing.ts` exporting a typed object. Structure identical to the YAML, with TypeScript types. This is the single source of truth for pricing — Luke will edit this to change rates, so keep it readable and well-commented.

### Environment variables

Create `.env.example` at project root:

```
# === Email (server-side only — NEVER prefix with VITE_) ===
RESEND_API_KEY=
INQUIRY_RECIPIENT_EMAIL=lukeshah100@gmail.com
SENDER_EMAIL=inquiries@smoothconcrete.com.au

# === Public config (exposed to browser — fine for these) ===
VITE_HUM_PORTAL_URL=https://hum.com.au/apply?ref=smoothconcrete
```

**Critical**: any variable prefixed with `VITE_` is bundled into the frontend JS and visible to anyone. Email API keys and recipient addresses must NOT be prefixed — they live only in the serverless function environment.

### Master TODO file

Maintain `TODO.md` at project root listing every placeholder awaiting Monday's input:

- Eligibility questions — `src/.../EligibilityStep.tsx:NN`
- Eligibility rule — `src/.../lib/eligibility.ts:NN`
- HUM portal URL — `.env`, `VITE_HUM_PORTAL_URL`
- Customer rejection email copy — `api/submit.ts:NN`
- Luke's notification email format — `api/submit.ts:NN`, verify on first send

---

## Constraints

### Must do
- All 9 form steps (including new eligibility)
- Pricing math identical to `originalcalc/backend/pricing_engine.py` (verified in `PRICING_TEST.md`)
- HUM bracket optimisation logic
- Inquiry email to Luke with full breakdown (mirror the HTML template in `originalcalc/backend/main.py`'s `build_inquiry_email` function)
- Eligibility branching
- HUM redirect on accepted outcome
- Rejection flow + dual email
- Premium UI per design requirements
- Embed cleanly at 380px wide

### Must not do (in v1)
- Photo upload (deferred to v1.1, documented in `TODO.md`)
- File storage of any kind
- Inquiry database / persistent logs (emails are the audit trail)
- Login / accounts
- Payment processing
- Admin dashboard
- CRM integration
- Internationalisation

### Must not touch
- `/originalcalc/` (read-only reference)

---

## Deliverables

In your project root (not in `/originalcalc/`):

1. **`/src/`** — frontend application source
2. **`/api/submit.ts`** — single serverless function
3. **`README.md`** — how to run, develop, deploy
4. **`DEPLOYMENT_NOTES.md`** documenting:
   - Visual direction chosen + why
   - Iframe dimensions for the Elementor embed (width × height)
   - Exact embed snippet for pasting into an Elementor "HTML" widget
   - Step-by-step instructions for the WordPress side (edit page → drop HTML widget into hero column → paste snippet → publish)
   - Vercel deployment steps + which env vars to set
   - Resend setup steps (account, domain verification, API key)
5. **`TODO.md`** — every placeholder with file:line references
6. **`PRICING_TEST.md`** — Python pricing test output alongside your new TS engine's output, side-by-side, proving parity
7. **Screenshots** at 380×720 and 360px mobile — all 9 steps + accepted outcome + rejected outcome
8. **One-command dev**: `npm run dev` starts the local dev server (use Vercel CLI `vercel dev` for function emulation)
9. **One-command deploy**: documented (`vercel --prod`)
10. **Deployed public URL** — pasted in `DEPLOYMENT_NOTES.md`

---

## Test Plan — Run Before Declaring Done

1. **Pricing parity** — Python test output vs TS test output, identical to the cent. Captured in `PRICING_TEST.md`.
2. **Eligible flow end-to-end** — walk every step with eligible details, confirm estimate displays, "Continue to HUM Finance" CTA appears, click triggers the email (check Resend dashboard) AND redirects to HUM URL.
3. **Rejected flow end-to-end** — submit with failing eligibility (e.g. bankruptcy=yes), confirm thank-you screen, no estimate calculated, two emails sent (Luke + customer).
4. **Form validation** — submit each step with invalid/missing data, confirm inline error messages, can't proceed.
5. **Mobile responsiveness** — Chrome DevTools at 360px width, walk every step, no horizontal scroll, all controls reachable.
6. **Iframe simulation** — test HTML page with `<iframe src="<deployed URL>" width="380" height="720" frameborder="0"></iframe>`, confirm clean render.
7. **Elementor embed** — paste the snippet from `DEPLOYMENT_NOTES.md` into an Elementor HTML widget on a test page, confirm it works (use the existing "Interest Free LP – bk" backup page in WordPress, not the live page).
8. **Accessibility** — Tab through every form, all inputs reachable, focus visible, labels associated correctly with controls.
9. **Edge cases** — very small job (10m²), very large (200m²), bracket-boundary jobs (e.g. exactly $7,000 subtotal). Confirm pricing engine handles them correctly.

---

## Definition of Done

- [ ] All 10 deliverables present
- [ ] Test plan executed, all items passing
- [ ] Deployed to a public Vercel URL (pasted in `DEPLOYMENT_NOTES.md`)
- [ ] `TODO.md` lists every placeholder with file:line references
- [ ] Embed snippet works when pasted into an Elementor HTML widget
- [ ] Pricing matches original engine to the cent
- [ ] No code in `/originalcalc/` was modified
- [ ] Resend account configured, sender domain verified, test emails arrived
- [ ] At least one eligible and one rejected submission has been completed end-to-end and the emails received

---

## Working Style Expectations

- **Plan first**: before writing code, output your visual-direction proposal, file structure, and build order. Wait for sign-off.
- **Math first**: port and verify pricing logic in TypeScript BEFORE writing any UI. Numbers wrong = nothing else matters.
- **Ask, don't assume**: anything ambiguous in this README → ask, don't guess.
- **Commit incrementally**: clean git commits with clear messages. Init git if it's not already.
- **Document as you go**: don't leave docs for the end. Update `TODO.md` the moment you add a placeholder.
- **No emoji in user-facing UI** — restraint signals premium. Use icon components instead.
- **No scope creep**: if you find yourself wanting to add photos / accounts / dashboards / a database — don't. They're explicitly out of scope. Note them in a "Future work" section of `DEPLOYMENT_NOTES.md` instead.
