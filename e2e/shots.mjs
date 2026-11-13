// Screenshots of the Mini App with a mocked Telegram WebApp and mocked API (data from a local JSON file).
// usage: node e2e/shots.mjs <mock_boot.json> <out_dir> [base_url]
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";

const [, , bootFile, outDir, base = "http://127.0.0.1:4173/ssa-miniapp/"] = process.argv;
const boot = readFileSync(bootFile, "utf8");
mkdirSync(outDir, { recursive: true });
const exe = process.env.CHROMIUM ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome`;
const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "ru-RU", timezoneId: "Europe/Moscow" });
const page = await ctx.newPage();
const puts = [];
await page.route("**/telegram.org/**", (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
await page.route("**/functions/v1/ssa-miniapp-api/**", (r) => {
  const req = r.request();
  if (req.method() === "OPTIONS") return r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
  const cors = { "access-control-allow-origin": "*" };
  if (req.method() === "PUT") { puts.push(JSON.parse(req.postData())); return r.fulfill({ contentType: "application/json", headers: cors, body: '{"ok":true}' }); }
  return r.fulfill({ contentType: "application/json", headers: cors, body: boot });
});
await page.addInitScript(() => {
  window.Telegram = { WebApp: { initData: "mock=1", initDataUnsafe: { user: { id: 1, first_name: "Анна" } }, ready() {}, expand() {}, close() {}, openLink() {}, setHeaderColor() {}, BackButton: { show() {}, hide() {}, onClick() {}, offClick() {} } } };
});
const shot = async (name) => { await page.waitForTimeout(250); await page.screenshot({ path: `${outDir}/${name}.png` }); console.log("shot", name); };
const tab = (t) => page.locator(".tabbar button", { hasText: t }).click();

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForSelector(".tabbar");
await shot("01_home");
await tab("Каталог"); await shot("02_catalog");
await page.locator(".cat", { hasText: "Молочная" }).click();
await shot("03_category");
const first = page.locator(".tile").first();
await first.locator(".btn-add").click();           // 0 -> 1
await first.locator(".qty button", { hasText: "+" }).click(); // 1 -> 2
console.log("qty on tile:", await first.locator(".qty b").innerText());
await shot("04_category_qty");
await page.locator(".tile").nth(1).locator(".tname").click();
await shot("05_product_sheet");
await page.locator(".sheet .btn-primary").click();
await tab("Корзина"); await shot("06_cart");
await page.locator(".cta-bar .btn-primary").click(); await shot("07_where");
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await shot("08_where_bottom");
await tab("Профиль"); await shot("09_profile");
await page.waitForTimeout(600);
console.log("PUT calls:", JSON.stringify(puts));
await browser.close();
