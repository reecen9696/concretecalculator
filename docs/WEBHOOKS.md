# GoHighLevel Webhook Spec — Driveway Estimate Form

Spec for the two inbound webhooks that push leads from the React estimate app
into GoHighLevel (GHL). Field names and types are derived from the actual form
code (`src/types/form.ts`, `src/lib/pricing.ts`).

> **Context:** the app is a multi-step React SPA. GHL's external-tracking
> script handles page-view tracking but **cannot** auto-capture this form
> (no native `<form>`, JS `fetch` submit, email field not visible at submit).
> So leads are sent to GHL by POSTing directly to an inbound webhook.

---

## Webhook 1 — Partial lead (first page / abandonment)

**Fires:** as soon as the user completes the **contact step** (validates +
clicks Next). This captures them even if they drop off before finishing.
A true "closed the tab" `beforeunload` trigger is unreliable across
browsers/mobile — firing on page-1 completion is the robust way to catch
abandoners.

| Field         | Type              | Notes                                |
| ------------- | ----------------- | ------------------------------------ |
| `name`        | string            | Full name as entered ("John Smith")  |
| `email`       | string (email)    | Required, validated                  |
| `phone`       | string            | Free text ("0412 345 678")           |
| `suburb`      | string            | Suburb **or** postcode               |
| `event`       | string            | Constant: `"partial_lead"`           |
| `submittedAt` | string (ISO 8601) | e.g. `"2026-06-26T04:15:00.000Z"`    |
| `sourceUrl`   | string (URL)      | The page the form was on             |

**Example body:**

```json
{
  "event": "partial_lead",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "0412 345 678",
  "suburb": "Docklands VIC 3008",
  "submittedAt": "2026-06-26T04:15:00.000Z",
  "sourceUrl": "https://concretecalculator-two.vercel.app/"
}
```

---

## Webhook 2 — Full submission (final page)

**Fires:** on the estimate step (final submit), in parallel with the existing
inquiry email. Contains everything collected.

### Contact fields

| Field    | Type           | Notes                  |
| -------- | -------------- | ---------------------- |
| `name`   | string         | Full name              |
| `email`  | string (email) |                        |
| `phone`  | string         |                        |
| `suburb` | string         | Suburb or postcode     |

### Project fields

| Field               | Type                                       | Values                                                                       |
| ------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| `areaSqm`           | number                                     | Total m² (0 when method = `plans`)                                           |
| `areaMethod`        | string (enum)                              | `"total"` \| `"sections"` \| `"plans"`                                       |
| `areaSections`      | array of `{ length: number, width: number }` | Only when method = `sections`                                              |
| `finish`            | string (enum)                              | `"natural_grey"` \| `"coloured"` \| `"exposed_aggregate"` \| `"pavilion_finish"` |
| `hasRemoval`        | boolean                                    | Existing surface to remove?                                                  |
| `slope`             | string (enum)                              | `"flat_minimal"` \| `"moderately_steep"` \| `"extremely_steep"`              |
| `drainage`          | string (enum)                              | `"no"` \| `"yes"` \| `"unsure"`                                              |
| `stripDrainLengthM` | number                                     | Only when `drainage = "yes"`                                                 |

### Estimate fields

Omitted on the `plans` path (no auto price — manual takeoff from drawings).

| Field                  | Type   | Notes              |
| ---------------------- | ------ | ------------------ |
| `estimateTotalIncGst`  | number | Final price inc GST |
| `repaymentWeekly`      | number | $/week             |
| `repaymentFortnightly` | number | $/fortnight        |
| `termWeeks`            | number | Finance term       |

### Files (links only — stored in Vercel Blob)

| Field    | Type                                                              | Notes               |
| -------- | ---------------------------------------------------------------- | ------------------- |
| `plans`  | array of `{ url: string, filename: string, contentType: string, size: number }` | Uploaded drawings   |
| `photos` | array of same shape                                              | Project photos      |

### Meta

| Field         | Type              | Notes                       |
| ------------- | ----------------- | --------------------------- |
| `event`       | string            | Constant: `"full_submission"` |
| `submittedAt` | string (ISO 8601) |                             |

**Example body:**

```json
{
  "event": "full_submission",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "0412 345 678",
  "suburb": "Docklands VIC 3008",
  "areaSqm": 120,
  "areaMethod": "total",
  "areaSections": [],
  "finish": "exposed_aggregate",
  "hasRemoval": false,
  "slope": "flat_minimal",
  "drainage": "no",
  "stripDrainLengthM": null,
  "estimateTotalIncGst": 18500.0,
  "repaymentWeekly": 209.0,
  "repaymentFortnightly": 418.0,
  "termWeeks": 156,
  "plans": [],
  "photos": [
    {
      "url": "https://...blob.../front.jpg",
      "filename": "front.jpg",
      "contentType": "image/jpeg",
      "size": 824133
    }
  ],
  "submittedAt": "2026-06-26T04:20:00.000Z"
}
```

---

## Decisions needed before implementation

1. **Name split for GHL.** GHL contacts use **First name / Last name**, but the
   form collects one "Full name" field. Options:
   - Send both `name` **and** split `first_name` / `last_name` (split on first
     space) so it maps cleanly either way. **(Recommended.)**
   - Send only `name` and split inside a GHL workflow.

2. **One webhook URL or two.** Either:
   - **One** inbound webhook, branch in GHL on the `event` field, or
   - **Two** separate webhook URLs (one per event).

## What's needed to go live

- The inbound webhook URL(s) from GHL
  (Automation → Workflows → **Inbound Webhook** trigger → copy URL).
- These get stored as a Vercel env var (e.g. `GHL_WEBHOOK_URL`) and the app
  POSTs to it on the two events above — in parallel with the existing
  Resend inquiry email (no change to current behaviour).
