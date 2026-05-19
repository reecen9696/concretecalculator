/**
 * Local smoke test for api/submit.ts — exercises the function with mock
 * VercelRequest/Response objects against four scenarios. RESEND_API_KEY is
 * unset, so the function runs in stub mode (logs the email instead of
 * sending), giving us a fast end-to-end check without spending an email.
 *
 *     npx tsx scripts/submit-smoke.ts
 */

import handler from "../api/submit";

interface MockRes {
  statusCode: number;
  body: unknown;
}

function mkReq(method: string, body: unknown) {
  return {
    method,
    body,
    headers: {},
    query: {},
    cookies: {},
  } as unknown as Parameters<typeof handler>[0];
}

function mkRes() {
  const out: MockRes = { statusCode: 0, body: null };
  const res = {
    status(code: number) {
      out.statusCode = code;
      return this;
    },
    json(body: unknown) {
      out.body = body;
      return this;
    },
  } as unknown as Parameters<typeof handler>[1];
  return { res, out };
}

async function run(label: string, payload: unknown, method = "POST") {
  const { res, out } = mkRes();
  await handler(mkReq(method, payload), res);
  console.log(`\n[${label}]  →  ${out.statusCode}  ${JSON.stringify(out.body)}`);
}

(async () => {
  // 1. Method check
  await run("GET (method check)", null, "GET");

  // 2. Bogus body
  await run("Invalid payload", { not: "valid" });

  // 3. Valid rejected
  await run("Valid rejected", {
    outcome: "rejected",
    customer: {
      name: "Test Customer",
      phone: "0412 345 678",
      email: "test@example.com",
      suburb: "Docklands VIC 3008",
    },
    eligibility: {
      residency: "yes",
      income: "30-60k",
      employment: "casual",
      bankruptcy: "yes",
    },
    failedCriteria: ["Bankruptcy declared in the last 5 years."],
  });

  // 4. Valid eligible (with full estimate)
  await run("Valid eligible (with estimate)", {
    outcome: "eligible",
    customer: {
      name: "Eligible Customer",
      phone: "0400 111 222",
      email: "eligible@example.com",
      suburb: "Richmond VIC 3121",
    },
    eligibility: {
      residency: "yes",
      income: "60-100k",
      employment: "full_time",
      bankruptcy: "no",
    },
    project: {
      areaSqm: 50,
      areaMethod: "total",
      finish: "exposed_aggregate",
      hasRemoval: false,
      slope: "flat_minimal",
      drainage: "no",
    },
    estimate: {
      finalIncGst: 16764.2,
      financeAdjustedExGst: 15240.19,
      gstAmount: 1524.02,
      originalSubtotal: 12500,
      optimizationOccurred: false,
      discountApplied: 0,
      originalBracket: {
        from: 10000.01,
        to: 15000,
        fortnights: 78,
        feePercent: 17.98,
        rangeDesc: "$10,000–$15,000",
      },
      optimizedBracket: {
        from: 10000.01,
        to: 15000,
        fortnights: 78,
        feePercent: 17.98,
        rangeDesc: "$10,000–$15,000",
      },
      repayment: {
        termWeeks: 156,
        fortnights: 78,
        fortnightly: 214.93,
        weekly: 107.46,
      },
      lineItems: [
        { description: "Exposed Aggregate", amount: 11000 },
        { description: "Excavation (0–65m²)", amount: 1500 },
      ],
      reviewFlags: [],
      optimizationDetails: null,
    },
  });

  // 5. Valid eligible (plans path — area_sqm = 0, plans + photos attached)
  await run("Valid eligible (plans path with attachments)", {
    outcome: "eligible",
    customer: {
      name: "Plans Customer",
      phone: "0400 999 888",
      email: "plans@example.com",
      suburb: "Brunswick VIC 3056",
    },
    eligibility: {
      residency: "yes",
      income: "100k+",
      employment: "self_employed",
      bankruptcy: "no",
    },
    project: {
      areaSqm: 0,
      areaMethod: "plans",
      finish: "coloured",
      hasRemoval: true,
      slope: "moderately_steep",
      drainage: "yes",
      stripDrainLengthM: 5,
    },
    plans: [
      {
        url: "https://example.blob.vercel-storage.com/plans/site-plan.pdf",
        filename: "site-plan.pdf",
        contentType: "application/pdf",
        size: 1234567,
      },
    ],
    photos: [
      {
        url: "https://example.blob.vercel-storage.com/photos/street.jpg",
        filename: "street.jpg",
        contentType: "image/jpeg",
        size: 482104,
      },
    ],
  });
})();
