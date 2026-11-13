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
  try { localStorage.setItem("ssa:welcome:v1", "1"); } catch {}
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
// step 2: photo tile, product sheet with the assistant rule, cart with photos
await tab("Каталог");
const photoTile = page.locator(".tile").filter({ has: page.locator("img.thumb") }).first();
if (await page.locator("img.thumb").count() === 0) {
  // open the first category that might have photos after a fresh load
  if (await page.locator(".cat").count()) await page.locator(".cat").first().click();
}
if (await page.locator("img.thumb").count() === 0) {
  // walk categories until a photo appears
  const cats = page.locator(".cat");
  const n = await cats.count();
  for (let i = 0; i < n; i++) {
    await tab("Каталог");
    await cats.nth(i).click();
    if (await page.locator("img.thumb").count()) break;
  }
}
if (await page.locator("img.thumb").count()) {
  const tile = page.locator(".tile").filter({ has: page.locator("img.thumb") }).first();
  await tile.scrollIntoViewIfNeeded();
  const img = tile.locator("img.thumb");
  await img.evaluate((el) => el.complete && el.naturalWidth > 0 || new Promise((res) => { el.onload = () => res(true); el.onerror = () => res(false); }));
  await shot("10_tile_photo");
  await shot("13_catalog_tiles");
  await tile.locator(".tname").click();
} else {
  await page.locator(".tile").first().locator(".tname").click();
  await shot("10_tile_photo");
}
await page.waitForSelector(".sheet .rules");
await page.locator(".sheet .rule-note").scrollIntoViewIfNeeded();
await shot("11_product_sheet_rule");
await page.locator(".sheet .btn-primary").click();
await tab("Корзина"); await shot("12_cart");
await page.locator(".cta-bar .btn-primary").click();
await page.waitForSelector(".chain-card");
await page.locator(".chain-card").first().click();
await page.waitForSelector(".pack-row");
await shot("14_checklist_single");
await page.locator(".pack-row .btn-shop").first().click();
await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
await page.waitForSelector(".pack-row.next");
await page.waitForTimeout(300);
await shot("17_checklist_next");
await page.locator("header .back").click();
await page.waitForSelector(".btn-mix, .chain-card");
if (await page.locator(".btn-mix").count()) {
  await page.locator(".btn-mix").click();
  await page.waitForSelector(".pack-block, .pack-row");
  await shot("15_checklist_mix");
  await page.locator("header .back").click();
} else {
  await shot("15_checklist_mix");
}
await tab("Корзина");
await page.waitForSelector(".cta-bar");
await shot("16_cart");
await tab("Главная");
await page.waitForSelector(".habit-teaser");
await page.locator(".habit-teaser").click();
await page.waitForSelector(".habit-grid");
await shot("18_how_i_shop");
await tab("Профиль");
await page.waitForSelector(".prof");
await shot("19_profile");
await page.goto(base.replace(/\/?$/, "/") + "?welcome=1", { waitUntil: "networkidle" });
await page.waitForSelector(".welcome");
await shot("20_welcome");
await page.waitForTimeout(600);
console.log("PUT calls:", JSON.stringify(puts));
await browser.close();
