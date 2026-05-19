/**
 * Drive the calculator through every distinct screen + key variations, at
 * both 380x720 (embed slot) and 360x720 (mobile minimum). Saves PNGs under
 * /screenshots/{viewport}/.
 *
 * Assumes a Vite dev server on http://localhost:5173. Boot it with
 * `npm run dev` in another terminal before running this.
 *
 *     npx tsx scripts/screenshots.ts
 *
 * The screenshots are deliberately driven by the in-app state — we click
 * through the real form, not a special test mode. So changes to the UI are
 * automatically reflected in the captures.
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.SCREENSHOT_URL ?? "http://localhost:5173";
const OUT = "./screenshots";

const VIEWPORTS = [
  { label: "380x720", width: 380, height: 720 },
  { label: "360x640", width: 360, height: 640 },
];

interface Shot {
  /** Slug used in the file name. */
  name: string;
  /** Whether the form journey is reset before this shot. */
  reset?: boolean;
  /** Run actions on the page before capturing. */
  setup: (page: Page) => Promise<void>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fillCustomer(page: Page) {
  await page.fill('input[name="name"]', "Jane Smith");
  await page.fill('input[name="phone"]', "0412 345 678");
  await page.fill('input[name="email"]', "jane@example.com");
  await page.fill('input[name="suburb"]', "Docklands VIC 3008");
}

async function clickContinue(page: Page) {
  await page
    .getByRole("button", { name: /continue|see estimate/i })
    .first()
    .click();
  await wait(450); // wait out the motion transition
}

async function selectOption(page: Page, label: string | RegExp) {
  await page
    .locator("label")
    .filter({ hasText: label })
    .first()
    .click();
}

const shots: Shot[] = [
  {
    name: "01-customer-empty",
    reset: true,
    setup: async () => {},
  },
  {
    name: "01-customer-filled",
    reset: true,
    setup: async (page) => {
      await fillCustomer(page);
    },
  },
  {
    name: "02-eligibility-empty",
    reset: true,
    setup: async (page) => {
      await fillCustomer(page);
      await clickContinue(page);
    },
  },
  {
    name: "02-eligibility-eligible-answers",
    reset: true,
    setup: async (page) => {
      await fillCustomer(page);
      await clickContinue(page);
      await selectOption(page, /^Yes$/);                      // residency yes
      await selectOption(page, /\$60,000 – \$100,000/);
      await selectOption(page, /^Full-time$/);
      // bankruptcy No is the first option visually under the last group;
      // be explicit by clicking the radio under the bankruptcy fieldset
      await page
        .locator('input[name="bankruptcy"][value="no"]')
        .locator("xpath=..")
        .click();
    },
  },
  {
    name: "03-area-empty",
    reset: true,
    setup: async (page) => {
      await goToArea(page, "eligible");
    },
  },
  {
    name: "03-area-total",
    reset: true,
    setup: async (page) => {
      await goToArea(page, "eligible");
      await selectOption(page, /I know the total m²/);
      await page.fill('input[step="0.1"]', "50");
    },
  },
  {
    name: "03-area-sections",
    reset: true,
    setup: async (page) => {
      await goToArea(page, "eligible");
      await selectOption(page, /Measure by section/);
      const lengthInputs = page.locator('input[placeholder="6"]');
      const widthInputs = page.locator('input[placeholder="3.5"]');
      await lengthInputs.first().fill("6");
      await widthInputs.first().fill("4");
    },
  },
  {
    name: "03-area-via-email",
    reset: true,
    setup: async (page) => {
      await goToArea(page, "eligible");
      await selectOption(page, /Send measurements via email/);
      await page.fill("textarea", "Roughly 3 car spaces wide, slight curve at the top.");
    },
  },
  {
    name: "04-finish",
    reset: true,
    setup: async (page) => {
      await goToArea(page, "eligible");
      await selectOption(page, /I know the total m²/);
      await page.fill('input[step="0.1"]', "50");
      await clickContinue(page);
      await selectOption(page, /Exposed aggregate/);
    },
  },
  {
    name: "05-removal",
    reset: true,
    setup: async (page) => {
      await goToFinish(page, "eligible");
      await selectOption(page, /Exposed aggregate/);
      await clickContinue(page);
      await selectOption(page, /^Yes$/);
    },
  },
  {
    name: "06-slope",
    reset: true,
    setup: async (page) => {
      await goToFinish(page, "eligible");
      await selectOption(page, /Exposed aggregate/);
      await clickContinue(page);
      await selectOption(page, /^No$/); // removal No
      await clickContinue(page);
      await selectOption(page, /Moderately steep/);
    },
  },
  {
    name: "07-drainage-no",
    reset: true,
    setup: async (page) => {
      await goToFinish(page, "eligible");
      await selectOption(page, /Exposed aggregate/);
      await clickContinue(page);
      await selectOption(page, /^No$/);
      await clickContinue(page);
      await selectOption(page, /Flat or minimal/);
      await clickContinue(page);
      await selectOption(page, /^No$/);
    },
  },
  {
    name: "07-drainage-yes-with-length",
    reset: true,
    setup: async (page) => {
      await goToFinish(page, "eligible");
      await selectOption(page, /Exposed aggregate/);
      await clickContinue(page);
      await selectOption(page, /^No$/);
      await clickContinue(page);
      await selectOption(page, /Flat or minimal/);
      await clickContinue(page);
      await selectOption(page, /^Yes$/);
      await page.fill('input[placeholder="6"]', "8");
    },
  },
  {
    name: "08-estimate-eligible-50m2-exposed",
    reset: true,
    setup: async (page) => {
      await goToEstimate(page, {
        finish: /Exposed aggregate/,
        removal: /^No$/,
        slope: /Flat or minimal/,
        drainage: /^No$/,
      });
    },
  },
  {
    name: "08-estimate-via-email",
    reset: true,
    setup: async (page) => {
      await goToArea(page, "eligible");
      await selectOption(page, /Send measurements via email/);
      await page.fill("textarea", "Long curving driveway, garage at end.");
      await clickContinue(page);
      await selectOption(page, /Coloured concrete/);
      await clickContinue(page);
      await selectOption(page, /^Yes$/); // removal yes
      await clickContinue(page);
      await selectOption(page, /Moderately steep/);
      await clickContinue(page);
      await selectOption(page, /^No$/); // drainage no
      await clickContinue(page);
    },
  },
  {
    name: "outcome-rejected",
    reset: true,
    setup: async (page) => {
      await fillCustomer(page);
      await clickContinue(page);
      await selectOption(page, /^Yes$/);
      await selectOption(page, /\$30,000 – \$60,000/);
      await selectOption(page, /^Full-time$/);
      // bankruptcy yes
      await page
        .locator('input[name="bankruptcy"][value="yes"]')
        .locator("xpath=..")
        .click();
      await clickContinue(page);
      await wait(700); // let auto-submit settle (will fail silently in dev)
    },
  },
];

async function goToArea(page: Page, outcome: "eligible" | "rejected") {
  await fillCustomer(page);
  await clickContinue(page);
  await selectOption(page, /^Yes$/);
  await selectOption(
    page,
    outcome === "eligible" ? /\$60,000 – \$100,000/ : /Less than \$30,000/,
  );
  await selectOption(page, /^Full-time$/);
  await page
    .locator(
      `input[name="bankruptcy"][value="${outcome === "eligible" ? "no" : "yes"}"]`,
    )
    .locator("xpath=..")
    .click();
  await clickContinue(page);
}

async function goToFinish(page: Page, outcome: "eligible") {
  await goToArea(page, outcome);
  await selectOption(page, /I know the total m²/);
  await page.fill('input[step="0.1"]', "50");
  await clickContinue(page);
}

async function goToEstimate(
  page: Page,
  picks: {
    finish: RegExp;
    removal: RegExp;
    slope: RegExp;
    drainage: RegExp;
  },
) {
  await goToFinish(page, "eligible");
  await selectOption(page, picks.finish);
  await clickContinue(page);
  await selectOption(page, picks.removal);
  await clickContinue(page);
  await selectOption(page, picks.slope);
  await clickContinue(page);
  await selectOption(page, picks.drainage);
  await clickContinue(page);
}

async function captureSet(context: BrowserContext, viewportLabel: string) {
  const dir = path.join(OUT, viewportLabel);
  await mkdir(dir, { recursive: true });

  for (const shot of shots) {
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await wait(200);

    try {
      await shot.setup(page);
    } catch (err) {
      console.error(`!! ${viewportLabel} ${shot.name} setup failed:`, err);
    }
    await wait(350); // allow motion to settle

    await page.screenshot({
      path: path.join(dir, `${shot.name}.png`),
      fullPage: false,
    });
    console.log(`✓ ${viewportLabel}/${shot.name}.png`);
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    await captureSet(context, vp.label);
    await context.close();
  }
  await browser.close();
  console.log("\nDone. See /screenshots/{380x720,360x640}/");
})();
