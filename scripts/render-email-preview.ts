/**
 * Dump rendered email HTML to /tmp so I can eyeball it.
 *
 *     npx tsx scripts/render-email-preview.ts
 *     open /tmp/email-{eligible,via-email,rejected-luke,rejected-customer}.html
 */

import { writeFileSync } from "node:fs";
import {
  buildLukeInquiryEmail,
  buildLukeRejectionEmail,
  buildCustomerRejectionEmail,
} from "../api/emails";

const eligibleWithEstimate = {
  outcome: "eligible" as const,
  customer: {
    name: "Jane Smith",
    phone: "0412 345 678",
    email: "jane@example.com",
    suburb: "Docklands VIC 3008",
  },
  eligibility: {
    residency: "yes" as const,
    income: "60-100k" as const,
    employment: "full_time" as const,
    bankruptcy: "no" as const,
  },
  project: {
    areaSqm: 50,
    areaMethod: "total" as const,
    finish: "exposed_aggregate" as const,
    hasRemoval: false,
    slope: "flat_minimal" as const,
    drainage: "no" as const,
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
      { description: "Exposed Aggregate: $220/m² × 50m²", amount: 11000 },
      { description: "Excavation (0–65m²)", amount: 1500 },
      { description: "Demolition (not required)", amount: 0 },
      { description: "Steepness (flat/minimal)", amount: 0 },
      { description: "Pump (not required)", amount: 0 },
      { description: "Strip Drain (not required)", amount: 0 },
    ],
    reviewFlags: [],
    optimizationDetails: null,
  },
};

const eligibleViaEmail = {
  outcome: "eligible" as const,
  customer: {
    name: "Pending Customer",
    phone: "0400 999 888",
    email: "pending@example.com",
    suburb: "Brunswick VIC 3056",
  },
  eligibility: {
    residency: "yes" as const,
    income: "100k+" as const,
    employment: "self_employed" as const,
    bankruptcy: "no" as const,
  },
  project: {
    areaSqm: 0,
    areaMethod: "via_email" as const,
    emailNote: "Roughly 3 car spaces wide, slight curve at the top.\nGarage at end of long approach.",
    finish: "coloured" as const,
    hasRemoval: true,
    slope: "moderately_steep" as const,
    drainage: "yes" as const,
    stripDrainLengthM: 5,
  },
};

const rejected = {
  outcome: "rejected" as const,
  customer: {
    name: "Test Reject",
    phone: "0412 345 678",
    email: "reject@example.com",
    suburb: "Footscray VIC 3011",
  },
  eligibility: {
    residency: "yes" as const,
    income: "30-60k" as const,
    employment: "casual" as const,
    bankruptcy: "yes" as const,
  },
  failedCriteria: ["Bankruptcy declared in the last 5 years."],
};

writeFileSync("/tmp/email-eligible.html", buildLukeInquiryEmail(eligibleWithEstimate));
writeFileSync("/tmp/email-via-email.html", buildLukeInquiryEmail(eligibleViaEmail));
writeFileSync("/tmp/email-rejected-luke.html", buildLukeRejectionEmail(rejected));
writeFileSync("/tmp/email-rejected-customer.html", buildCustomerRejectionEmail(rejected));

console.log("Rendered to /tmp/email-{eligible,via-email,rejected-luke,rejected-customer}.html");
