# Copy — Smooth Concrete driveway estimate form

All user-facing text, in the order it appears. Edit the **right-hand side** of each
line (the actual wording). The label/key on the left tells you where it lives so the
change can be applied to code. `{like_this}` = a value filled in automatically.

> **Changed in this version:** the first-step header has been reworked into a
> headline + subheadline (Global header section below). Grammar fix: "A" → "An".
>
> **Step order:** personal details lead, then driveway measurement, then the
> estimate: Customer details → Driveway Size → Area detail → Concrete Finish →
> Existing Surface → Driveway Slope → Drainage → Project Photos → Your Estimate.
> The first card shows the hero header (no orange title); every later card shows
> an orange centered title with its instruction as a centered subtitle beneath.

---

## Browser / page

| Where | Current text |
|---|---|
| Browser tab title | `Driveway Estimate · Smooth Concrete` |

## Global header (shown on the FIRST step only)

Reworked to a headline + subheadline. The headline leads with the accuracy promise;
the subheadline explains what the form does.

| Where | Text |
|---|---|
| Headline | `Get a 98% accurate quote, instantly` |
| Subheadline | `Input your driveway details and we'll give you an instant, near-exact estimate — no waiting, no call required.` |

_Notes:_
- _If only one line fits the design, use the headline alone — it stands on its own._
- _Previous single header `Get A Instant Estimate` is retired (also fixes the "A → An" grammar)._

## Global buttons (bottom of every step)

| Where | Current text |
|---|---|
| Back button | `← Back` |
| Next button (most steps) | `Next →` |
| Next button (last input step / Photos) | `See estimate →` |

---

## Step 1 — Customer details
_(no title on this step — the headline + subheadline sit above it)_

| Field | Label | Placeholder |
|---|---|---|
| Name | `Full Name` | `John Smith` |
| Phone | `Phone Number` | `0412 345 678` |
| Email | `Email Address` | `john@example.com` |
| Suburb | `Suburb / Postcode` | `Docklands VIC 3008` |

Error messages:
- Name empty: `Full name is required.`
- Phone empty: `Phone number is required.`
- Email empty: `Email address is required.`
- Email invalid: `Please enter a valid email address.`
- Suburb empty: `Suburb or postcode is required.`

---

## Step 2 — Driveway Size (choose how to measure)

- Title: `Driveway Size`
- Question label (shown as a centered subtitle): `How would you like to measure your driveway?`

> Note: on every step the instruction/question label (e.g. "Select your preferred
> finish") renders as a centered grey subtitle directly under the orange title,
> mirroring the first page's headline + subheadline.
- Options:
  1. `I know the total square metres`
  2. `I want to measure by sections (length × width)`
  3. `I'll upload plans or photos`
- Error: `Please choose how you'd like to measure your driveway.`

---

## Step 3 — Area detail (depends on the choice above)

### 3a. If "I know the total square metres"
- Title: `Total Area`
- Field label: `Total Area (m²)`
- Placeholder: `e.g. 25.5`
- Hint: `Enter the total square metres of your driveway.`
- Error: `Enter a valid total area in square metres.`

### 3b. If "measure by sections"
- Title: `Driveway Sections`
- Hint: `Add each section. If it's one straight rectangle, just add one.`
- Each card heading: `Section {number}`
- Field labels: `Length (m)` / `Width (m)`
- Placeholders: `e.g. 6` / `e.g. 3.5`
- Live calculation: `= {value} m²` (before entry: `Enter measurements`)
- Remove button: `Remove Section`
- Add button: `+ Add another section`
- Error: `Enter valid measurements for at least one section.`

### 3c. If "upload plans or photos"
- Title: `Upload Plans or Photos`
- Label: `Upload plans or scaled drawing`
- Upload box prompt: `Click to upload plans or photos showing the driveway area`
- Hint: `Please highlight the driveway area as accurately as possible. We'll scale from this marked area to estimate your driveway size.`
- Error: `Upload your plans or scaled drawing.`

---

## Step 4 — Concrete Finish

- Title: `Concrete Finish`
- Question label: `Select your preferred finish`
- Options (heading / sub-text):
  1. `Natural Grey` — `Classic, affordable concrete`
  2. `Coloured Concrete` — `Custom colours available`
  3. `Exposed Aggregate` — `Premium decorative finish`
  4. `Pavilion Finish` — `Premium polished surface`
- Error: `Please select a concrete finish.`

---

## Step 5 — Existing Surface

- Title: `Existing Surface`
- Question label: `Is there an existing driveway or surface to remove?`
- Options:
  1. `No, new site or clear area`
  2. `Yes, demolition / removal required`
- Error: `Please tell us about any existing surface.`

---

## Step 6 — Driveway Slope

- Title: `Driveway Slope`
- Question label: `How steep is the driveway?`
- Options:
  1. `Flat or minimal slope`
  2. `Moderately steep`
  3. `Extremely steep`
- Error: `Please select the driveway slope.`

---

## Step 7 — Drainage

- Title: `Drainage`
- Question label: `Does water naturally fall back toward the garage?`
- Options:
  1. `No, water drains away`
  2. `Yes, water pools at the garage`
  3. `Unsure`
- If "Yes" is chosen, an extra field appears:
  - Label: `Approximate strip drain length (metres) — optional`
  - Placeholder: `6`
  - Hint: `Leave blank if unsure — we'll estimate during review.`
- Error: `Please answer the drainage question.`

---

## Step 8 — Project Photos

- Title: `Project Photos`
- Label: `Upload at least one photo`
- Upload box prompt: `Click to upload photos (JPG, PNG, GIF, WebP)`
- Hint: `Recommended: street-facing, garage-facing, and side slope views.`
- Error: `Upload at least one photo.`

### Shared upload widget text (Steps 3c and 8)
- Appended to prompt when slots remain: `(up to {n} more)`
- When full: `Maximum {n} files reached`
- While uploading: `Uploading {percent}%`
- Remove a file: `Remove`
- Dismiss an upload error: `Dismiss`

---

## Step 9 — Your Estimate

- Title: `Your Estimate`
- Loading state: `Calculating…`
- Estimate box:
  - Label: `Estimated Project Investment`
  - Amount: `{price}` (auto)
  - Fine print: `Subject to site review and final approval.`
- Repayment box:
  - Heading: `Repayment Options · HUM Finance`
  - Line 1: `Pay over {n} fortnights ({weeks} weeks)`
  - Big number: `{amount}/week`
  - Line 3: `{amount} per fortnight`
- "Important Notes" box (only if there are flags):
  - Heading: `Important Notes`
  - (flag wording is auto-generated — see next section)
- Submit button: `Continue to HUM Finance →` (while sending: `Sending…`)
- If submit fails: `Submission error: {message}`
- Generic failure fallback: `Something went wrong. Please try again.`

---

## Auto-generated estimate notes ("Important Notes" / review flags)

These are produced by the pricing engine and shown to the customer when relevant:

- `Line pump may be required for areas over 100m² — confirm on site.`
- `Drainage answer was 'unsure' — strip drain estimate carries default 6m allowance, confirm on site.`
- `Subtotal lifted to project minimum of ${amount}.`

---

## Internal — email sent to Luke (customer never sees this)

Subject line:
- With estimate: `Driveway Estimate — {name} — {price}`
- Plans path, no number yet: `Driveway Inquiry (measurements pending) — {name}`

Section headings inside the email:
`Customer Details` · `Project Details` · `Plans / Site Drawings` · `Photos` ·
`Review Flags` · `Pricing Breakdown` · `HUM Finance Calculation` ·
`Customer-Facing Repayment`

Misc email text:
- When area comes from plans: `To be derived from uploaded plans`
- Pricing subtotal row: `Subtotal (ex GST, ex finance)`
- Final line: `Final Estimate (inc GST)`
- Repayment block: `Weekly Repayment Amount`
- Timestamp line: `Received {date/time}`
