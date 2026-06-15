import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

const VIEWPORT_POOL = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1280, height: 800 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 偽裝成真實瀏覽器的初始化腳本（於頁面載入前注入）。 */
const STEALTH_INIT = `
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  Object.defineProperty(navigator, 'languages', { get: () => ['zh-TW', 'zh', 'en-US', 'en'] });
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
  window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {} };
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (params) =>
    params.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(params);
`;

export async function launchStealthBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });
}

export async function newStealthContext(browser: Browser): Promise<BrowserContext> {
  const ctx = await browser.newContext({
    userAgent: pick(UA_POOL),
    viewport: pick(VIEWPORT_POOL),
    locale: "zh-TW",
    timezoneId: "Asia/Taipei",
    extraHTTPHeaders: {
      "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });
  await ctx.addInitScript(STEALTH_INIT);
  return ctx;
}

export function randomDelay(minMs = 1_200, maxMs = 3_500): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  return new Promise((r) => setTimeout(r, ms));
}

/** 模擬人類滾動頁面。 */
export async function humanScroll(page: Page, pixels = 400): Promise<void> {
  await page.evaluate((px) => window.scrollBy({ top: px, behavior: "smooth" }), pixels);
  await randomDelay(600, 1_400);
}

/** 隨機移動滑鼠至頁面某處。 */
export async function randomMouseMove(page: Page): Promise<void> {
  const vp = page.viewportSize() ?? { width: 1366, height: 768 };
  const x = Math.floor(Math.random() * vp.width * 0.8 + vp.width * 0.1);
  const y = Math.floor(Math.random() * vp.height * 0.5 + 100);
  await page.mouse.move(x, y);
  await randomDelay(300, 800);
}

/** 嘗試關閉 Cookie 同意彈窗（若出現）。 */
export async function dismissCookieConsent(page: Page): Promise<void> {
  const selectors = [
    'button:has-text("Accept all")',
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("同意")',
    'button:has-text("接受")',
    '[data-testid="acceptAll"]',
    '#onetrust-accept-btn-handler',
  ];
  for (const sel of selectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await btn.click();
      await randomDelay(500, 1_000);
      return;
    }
  }
}
