import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";
import { chromium } from "playwright";

const PROJECT_URL = "https://iwnlsjaayljcohbrbqkt.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bmxzamFheWxqY29oYnJicWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTYxMDIsImV4cCI6MjA4NjEzMjEwMn0.VFkTZ0WhHAqvJwHookoxMPfY63sxjD4P-gLZ1lHausU";
const APP_URL = "http://127.0.0.1:4173";
const password = "Test1234!";
const stamp = Date.now();
const smokeEmail = `codex.e2e.ui.${stamp}@example.com`;
const smokeSubject = `Smoke-${stamp}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 120000) {
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_e) {
      // retry
    }

    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for server: ${url}`);
    }
    await sleep(1200);
  }
}

async function createSmokeUser() {
  const headers = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
  };

  const resp = await fetch(`${PROJECT_URL}/auth/v1/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: smokeEmail,
      password,
      data: {
        first_name: "Codex",
        last_name: "UISmoke",
        grade_level: "Grade 10",
      },
    }),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Signup failed: ${JSON.stringify(json)}`);
  }
}

async function run() {
  const dev = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], {
    shell: true,
    stdio: "ignore",
  });

  try {
    await createSmokeUser();
    await waitForServer(`${APP_URL}/login`);

    const browser = await chromium.launch({ headless: true, channel: "msedge" });
    const page = await browser.newPage();

    await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Email address").fill(smokeEmail);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/dashboard", { timeout: 60000 });
    await page.goto(`${APP_URL}/ai-helper`, { waitUntil: "domcontentloaded" });
    try {
      await page.getByRole("heading", { name: /ai study helper/i }).waitFor({ timeout: 60000 });
    } catch (error) {
      const url = page.url();
      const text = await page.locator("body").innerText().catch(() => "");
      console.error(`AI_PAGE_URL:${url}`);
      console.error(`AI_PAGE_TEXT:${String(text).slice(0, 600)}`);
      throw error;
    }

    const titleInput = page.locator('label:has-text("Title") + input');
    const subjectInput = page.locator('label:has-text("Subject") + input');
    await titleInput.fill(`Smoke Title ${stamp}`);
    await subjectInput.fill(smokeSubject);
    await page.getByPlaceholder("Paste or type your note content here...").fill(
      `UI smoke content ${stamp}. Photosynthesis converts light to chemical energy.`,
    );

    await page.getByRole("button", { name: /generate with ai/i }).click();
    await page.getByRole("heading", { name: /ai explanation/i }).waitFor({ timeout: 90000 });
    await page.getByRole("button", { name: /save explanation/i }).click();

    await page
      .locator("text=Explanation saved")
      .first()
      .waitFor({ timeout: 60000 });

    await page.goto(`${APP_URL}/notes`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Search notes by title or subject...").fill(smokeSubject);
    await page.locator(`text=${smokeSubject}`).first().waitFor({ timeout: 60000 });

    console.log(`UI_SMOKE:PASS`);
    console.log(`SMOKE_EMAIL:${smokeEmail}`);
    console.log(`SMOKE_SUBJECT:${smokeSubject}`);
    mkdirSync("tmp", { recursive: true });
    writeFileSync(
      "tmp/ui-smoke-result.json",
      JSON.stringify(
        {
          status: "pass",
          email: smokeEmail,
          subject: smokeSubject,
          at: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    await browser.close();
  } finally {
    dev.kill();
  }
}

run().catch((error) => {
  console.error("UI_SMOKE:FAIL");
  console.error(error?.stack || error?.message || String(error));
  mkdirSync("tmp", { recursive: true });
  writeFileSync(
    "tmp/ui-smoke-result.json",
    JSON.stringify(
      {
        status: "fail",
        email: smokeEmail,
        subject: smokeSubject,
        at: new Date().toISOString(),
        error: error?.stack || error?.message || String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
