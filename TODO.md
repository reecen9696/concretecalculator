# TODO — Placeholders awaiting Luke's input

Every placeholder in the codebase is listed here with a `file:line` reference.
Resolve them in order; tick the box and update the reference when you replace
each one. **Do not ship to production until every Monday-blocking item is
resolved.**

## Monday-blocking (must resolve before going live)

- [ ] **Eligibility questions copy & options**
  Files:
  - `src/components/steps/EligibilityStep.tsx:1` — placeholder questions + UI
  - `src/lib/eligibility.ts:1` — placeholder rule body
  - `src/types/form.ts:36` — placeholder enum values (`ResidencyAnswer`,
    `IncomeBand`, `EmploymentStatus`, `BankruptcyAnswer`)
  Action: replace placeholder questions and answer enums with Luke's
  documented HUM Finance criteria; update `evaluateEligibility()` rule.

- [ ] **HUM portal referral URL**
  Files:
  - `.env.example` — `VITE_HUM_PORTAL_URL` documented as placeholder
  - Vercel project env vars — set `VITE_HUM_PORTAL_URL` for Production,
    Preview, Development scopes
  Action: replace the `https://hum.com.au/apply?ref=smoothconcrete` placeholder
  with Luke's confirmed partner-referral URL.

- [ ] **Customer rejection email copy**
  File: `api/submit.ts` — `buildCustomerRejectionEmail()` (added in build
  step e; reference will be a `// TODO(monday): replace copy` comment above
  the template string).
  Action: replace placeholder body with Luke's exact copy and contact phone
  number.

- [ ] **Luke's inquiry email format (verify on first send)**
  File: `api/submit.ts` — `buildLukeInquiryEmail()` (build step e).
  Action: send a test inquiry, ask Luke if the layout matches what he's used
  to from the original calculator. Adjust HTML structure if he wants changes.

- [ ] **Sender domain cutover (Resend)**
  Files:
  - `.env.example` — defaults to `onboarding@resend.dev`
  - `DEPLOYMENT_NOTES.md` — documents cutover steps to
    `inquiries@smoothconcrete.com.au`
  Action: once DNS access to `smoothconcrete.com.au` is sorted, verify the
  domain in Resend, then update `SENDER_EMAIL` in Vercel env vars.

## v1.1 (deferred features, not blocking ship)

- [ ] **Photo upload** — original calculator accepted up to 5 photos. Removed
  from v1 (no file storage). If Luke needs photos for a lead he requests
  them via reply to the inquiry email. Re-add in v1.1 if friction emerges.
  Reference: `README.md:42` ("No photo upload step in v1.")

## Cosmetic / non-blocking

- [ ] **Unused `humOptimization.onlyWhenClose` config field** — present in
  the original `pricing.yaml`, never read by the engine. Ported verbatim to
  `src/config/pricing.ts:101` for structural parity. Decide whether to
  remove or actually wire it up.

## How to update this file

When you resolve a TODO, replace the placeholder in code, update the
file:line reference to point at where the live value now sits (or remove
the entry entirely if the placeholder is gone), and tick the checkbox.
Keep this file honest — outdated TODO references are worse than no TODOs.
