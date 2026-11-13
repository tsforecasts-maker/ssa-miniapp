// Cart pricing and «Где выгоднее»: a port of ssa_app/cart.py (same rules, same rounding).
// Pure functions, no I/O. Used by the Mini App (instant recalculation) and by the Edge Function (GET /compare).

export interface Offer {
  k: number; // catalogue item id
  c: string; // chain code
  p: string; // chain product id
  t: string | null; // title
  b: string | null; // product brand
  wv: number | null; // weight value
  wu: string | null; // weight unit
  pr: number; // price
  rg: number | null; // regular price
  co: boolean; // card only
  pf: boolean; // promo
  at: string | null; // observed at (ISO)
  st: boolean | null; // in stock
  u: string | null; // url
}
export interface CatalogItem {
  id: number;
  sku: string;
  name: string;
  cat: number;
  brand: string | null;
  size: string | null;
  brands: string[];
  img?: string | null;
}
export interface ChainInfo { code: string; name: string; in: string; url: string | null }
export interface DeliveryRule {
  min_order: number | null; fee: number; extra_fee: number; bag_fee: number; free_from: number | null; verified: boolean;
}
export interface Rules {
  chains: ChainInfo[];
  delivery: Record<string, DeliveryRule>;
  freshness: Record<string, { fresh_hours: number; stale_hours: number; note: string | null }>;
}
export interface HouseholdInfo {
  id: number; name: string | null; area_code: string | null; area: string | null;
  stores: Record<string, string>; cards: Record<string, boolean>;
  bank_cards: { name: string; percent: number }[]; cashback_pct: number;
}
export type AssistantRule = 1 | 2 | 3;
export const DEFAULT_RULE: AssistantRule = 2;
export function asRule(r?: number | null): AssistantRule { return r === 1 || r === 3 ? r : 2; }
export interface Pick { catalog_id: number; qty: number | null; brand: string | null; rule?: number }
export interface Data { items: CatalogItem[]; offers: Offer[]; rules: Rules; household: HouseholdInfo }

export const PEREKRESTOK_NOTE = "данные могут быть старше";
export const DISCLAIMER = "Цены актуальны на момент сравнения и могут измениться в приложениях магазинов. Цены предварительные.";
const FRESHNESS: Record<string, string> = { fresh: "актуально", stale: "цены устарели", check: "проверить актуальность" };

export const r2 = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;

/** Cashback in rubles: goods × pct / 100 rounded to kopecks, ties to even (as Python's Decimal.quantize). */
export function cashbackOf(goods: number, pct: number): number {
  const cents = goods * pct; // = rubles × 100
  const fl = Math.floor(cents + 1e-9);
  const diff = cents - fl;
  const n = Math.abs(diff - 0.5) < 1e-7 ? (fl % 2 === 0 ? fl : fl + 1) : Math.round(cents);
  return n / 100;
}

export function money(v: number): string {
  const x = r2(Math.abs(v));
  const whole = Math.floor(x + 1e-9);
  const frac = Math.round((x - whole) * 100);
  const w = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return `${v < 0 ? "−" : ""}${w}${frac ? "," + String(frac).padStart(2, "0") : ""}\u00a0₽`;
}

export function goodsWord(n: number): string {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return "товар";
  if ([2, 3, 4].includes(n10) && ![12, 13, 14].includes(n100)) return "товара";
  return "товаров";
}

const norm = (s: string | null | undefined): string =>
  (s ?? "").trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");

export function brandMatches(wanted: string | null, productBrand: string | null, title: string | null): boolean {
  const w = norm(wanted);
  return !w || norm(productBrand) === w || norm(title).includes(w);
}

type Amount = [number, "vol" | "pcs"];

export function parseSize(text: string | null | undefined): [number, "g" | "ml" | "pcs"] | null {
  if (!text) return null;
  const m = /(\d+(?:[.,]\d+)?)\s*(кг|kg|г|гр|g|мл|ml|л|l|шт\.?|pcs)/i.exec(String(text).trim());
  if (!m) return null;
  const val = parseFloat(m[1].replace(",", "."));
  const u = m[2].toLowerCase().replace(/\.$/, "");
  if (u === "кг" || u === "kg") return [val * 1000, "g"];
  if (u === "г" || u === "гр" || u === "g") return [val, "g"];
  if (u === "л" || u === "l") return [val * 1000, "ml"];
  if (u === "мл" || u === "ml") return [val, "ml"];
  return [val, "pcs"];
}

export function amount(value: number | string | null, unit: string | null): Amount | null {
  if (value === null || value === undefined || unit === null || unit === undefined) return null;
  const v = Number(value);
  if (unit === "g" || unit === "ml") return [v / 1000, "vol"];
  if (unit === "kg" || unit === "l") return [v, "vol"];
  if (unit === "pcs") return [v, "pcs"];
  const p = parseSize(`${value} ${unit}`);
  return p ? amount(p[0], p[1]) : null;
}

const PACK_RANGE: [number, number] = [0.6, 1.7];

export function packsNeeded(need: number, pack: number, usualPack: number | null, usualCount: number | null): number | null {
  if (pack <= 0 || need <= 0) return null;
  if (usualPack) {
    const ratio = pack / usualPack;
    if (ratio < PACK_RANGE[0] || ratio > PACK_RANGE[1]) return null;
    if (usualCount) need = usualCount * usualPack;
  }
  return Math.max(1, Math.floor(need / pack + 0.5));
}

export function packsFor(qty: number, usual: Amount | null, offer: Amount | null): number | null {
  const q = Math.max(1, qty || 1);
  if (usual && offer && usual[1] === offer[1]) return packsNeeded(q * usual[0], offer[0], usual[0], q);
  return q;
}

export type Basis = "shelf" | "promo" | "card" | "card_assumed";
export function effectivePrice(o: { co: boolean; pr: number; rg: number | null; pf: boolean }, hasCard: boolean): { price: number; basis: Basis } {
  if (!o.co) return { price: o.pr, basis: o.pf ? "promo" : "shelf" };
  if (hasCard) return { price: o.pr, basis: "card" };
  if (o.rg !== null) return { price: o.rg, basis: "shelf" };
  return { price: o.pr, basis: "card_assumed" };
}

export interface PricedOffer {
  chain: string; title: string; brand: string | null; qty: number; // qty = packs
  unit: number; basis: Basis; regularLine: number; line: number;
  at: string | null; url: string | null; substitute: boolean;
}

export interface CartItem {
  id: number; name: string; qty: number; brand: string | null; catalogBrand: string | null;
  size: string | null; cat: number; img: string | null; rule: AssistantRule;
  offers: Record<string, PricedOffer>; suggestions: Record<string, PricedOffer>;
}
export interface Basket {
  chain: string; name: string; goods: number; fee: number; cashback: number; total: number; n: number;
  missing: string[]; items: { item: CartItem; offer: PricedOffer }[]; note: string | null;
  meetsMin: boolean; verified: boolean; regularGoods: number;
}
export interface Split {
  baskets: Basket[]; missing: string[]; goods: number; fee: number; cashback: number; total: number; n: number; regularGoods: number;
}
export interface Comparison {
  items: CartItem[]; areaOk: boolean; cashbackPct: number; singles: Basket[]; bestSingle: Basket | null;
  bestSplit: Split | null; asOf: string | null;
}

function pricedOffer(o: Offer, qty: number, hasCard: boolean, wanted: string | null, usual: Amount | null): PricedOffer | null {
  if (wanted && !brandMatches(wanted, o.b, o.t)) return null;
  const packs = packsFor(qty, usual, amount(o.wv, o.wu));
  if (packs === null) return null;
  const ep = effectivePrice(o, hasCard);
  const reg = Math.max(o.rg ?? ep.price, ep.price);
  return {
    chain: o.c, title: o.t ?? "", brand: o.b, qty: packs, unit: ep.price, basis: ep.basis,
    regularLine: r2(reg * packs), line: r2(ep.price * packs), at: o.at, url: o.u, substitute: false,
  };
}

export function buildItems(d: Data, picks: Pick[]): CartItem[] {
  const byId = new Map(d.items.map((i) => [i.id, i]));
  const offersBy = new Map<number, Offer[]>();
  for (const o of d.offers) (offersBy.get(o.k) ?? offersBy.set(o.k, []).get(o.k)!).push(o);
  const out: CartItem[] = [];
  for (const p of picks) {
    const it = byId.get(p.catalog_id);
    if (!it) continue;
    const qty = p.qty ?? 1;
    const rows = offersBy.get(it.id) ?? [];
    const tgt = parseSize(it.size);
    const sample = rows[0];
    const usual = (tgt ? amount(tgt[0], tgt[1]) : null) ?? (sample ? amount(sample.wv, sample.wu) : null);
    const wanted = p.brand || it.brand;
    const rule = asRule(p.rule);
    const preferred: Record<string, PricedOffer> = {};
    const anyOk: Record<string, PricedOffer> = {};
    for (const o of rows) {
      if (o.st === false) continue;
      const card = !!d.household.cards[o.c];
      const poAny = pricedOffer(o, qty, card, null, usual);
      const poWant = pricedOffer(o, qty, card, wanted, usual);
      if (poAny && (!anyOk[o.c] || poAny.line < anyOk[o.c].line)) anyOk[o.c] = poAny;
      if (poWant && (!preferred[o.c] || poWant.line < preferred[o.c].line)) preferred[o.c] = poWant;
    }
    const best: Record<string, PricedOffer> = {};
    const suggestions: Record<string, PricedOffer> = {};
    if (!wanted || rule === 3) {
      for (const [ch, o] of Object.entries(anyOk)) {
        const isSub = !!(wanted && !brandMatches(wanted, o.brand, o.title));
        best[ch] = { ...o, substitute: isSub };
      }
    } else {
      for (const [ch, o] of Object.entries(preferred)) best[ch] = { ...o, substitute: false };
      if (rule === 2) {
        for (const [ch, o] of Object.entries(anyOk)) {
          if (brandMatches(wanted, o.brand, o.title)) continue;
          const pref = preferred[ch];
          if (!pref || o.line + 0.005 < pref.line) suggestions[ch] = { ...o, substitute: true };
        }
      }
    }
    out.push({ id: it.id, name: it.name, qty, brand: p.brand, catalogBrand: it.brand, size: it.size, cat: it.cat,
      img: it.img ?? null, rule, offers: best, suggestions });
  }
  out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return out;
}

function basket(d: Data, chain: string, pairs: { item: CartItem; offer: PricedOffer }[], missing: string[], pct: number): Basket {
  const goods = r2(pairs.reduce((s, x) => s + x.offer.line, 0));
  const regularGoods = r2(pairs.reduce((s, x) => s + x.offer.regularLine, 0));
  const rule = d.rules.delivery[chain];
  let fee = 0, meets = true, verified = false, note: string | null = "стоимость доставки неизвестна";
  if (rule) {
    const free = rule.free_from !== null && goods >= rule.free_from;
    fee = r2((free ? 0 : rule.fee + rule.extra_fee) + rule.bag_fee);
    meets = rule.min_order === null || goods >= rule.min_order;
    verified = rule.verified;
    const bits: string[] = [];
    if (!verified) bits.push("ориентировочно");
    if (!meets && rule.min_order !== null) bits.push(`мин. заказ ${money(rule.min_order)} не набран`);
    note = bits.join(", ") || null;
  }
  const cashback = pct ? cashbackOf(goods, pct) : 0;
  const name = d.rules.chains.find((c) => c.code === chain)?.name ?? chain;
  return { chain, name, goods, fee, cashback, total: r2(goods + fee - cashback), n: pairs.length, missing, items: pairs, note,
    meetsMin: meets, verified, regularGoods };
}

function combos<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  const out: T[][] = [];
  arr.forEach((x, i) => combos(arr.slice(i + 1), k - 1).forEach((rest) => out.push([x, ...rest])));
  return out;
}

export function compare(d: Data, picks: Pick[]): Comparison {
  const pct = d.household.cashback_pct || 0;
  const areaOk = Object.keys(d.household.stores).length > 0;
  if (!areaOk) return { items: [], areaOk: false, cashbackPct: pct, singles: [], bestSingle: null, bestSplit: null, asOf: null };
  const items = buildItems(d, picks);
  const order = d.rules.chains.map((c) => c.code);
  const singles: Basket[] = [];
  for (const ch of order) {
    const pairs = items.filter((i) => ch in i.offers).map((i) => ({ item: i, offer: i.offers[ch] }));
    if (!pairs.length) continue;
    singles.push(basket(d, ch, pairs, items.filter((i) => !(ch in i.offers)).map((i) => i.name), pct));
  }
  singles.sort((a, b) => b.n - a.n || a.total - b.total || (a.chain < b.chain ? -1 : 1));
  const bestSingle = singles[0] ?? null;

  let bestSplit: Split | null = null;
  const present = [...new Set(items.flatMap((i) => Object.keys(i.offers)))].sort();
  for (const k of [2, 3]) {
    for (const combo of combos(present, k)) {
      const group: Record<string, { item: CartItem; offer: PricedOffer }[]> = Object.fromEntries(combo.map((c) => [c, []]));
      const leftover: string[] = [];
      for (const it of items) {
        const cands = combo.filter((c) => c in it.offers).map((c) => [it.offers[c].line, c] as [number, string]);
        if (!cands.length) { leftover.push(it.name); continue; }
        cands.sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
        group[cands[0][1]].push({ item: it, offer: it.offers[cands[0][1]] });
      }
      if (Object.values(group).filter((g) => g.length).length < 2) continue;
      const baskets = Object.entries(group).filter(([, g]) => g.length).map(([ch, g]) => basket(d, ch, g, [], pct));
      const sum = (f: (b: Basket) => number) => r2(baskets.reduce((s, b) => s + f(b), 0));
      const goods = sum((b) => b.goods), fee = sum((b) => b.fee), cashback = sum((b) => b.cashback);
      const opt: Split = { baskets, missing: leftover, goods, fee, cashback, total: r2(goods + fee - cashback),
        n: baskets.reduce((s, b) => s + b.n, 0), regularGoods: sum((b) => b.regularGoods) };
      if (!bestSplit || opt.n > bestSplit.n || (opt.n === bestSplit.n && opt.total < bestSplit.total)) bestSplit = opt;
    }
  }
  const times = items.flatMap((i) => Object.values(i.offers).map((o) => o.at)).filter((x): x is string => !!x).sort();
  return { items, areaOk, cashbackPct: pct, singles, bestSingle, bestSplit, asOf: times.length ? times[times.length - 1] : null };
}

/** fresh | stale | check — thresholds per chain from app.chain_freshness; computed at view time. */
export function freshness(rules: Rules, chain: string, at: string | null, now = Date.now()): string {
  const f = rules.freshness[chain];
  if (!f || !at) return "check";
  const h = (now - Date.parse(at)) / 3600000;
  return h <= f.fresh_hours ? "fresh" : h <= f.stale_hours ? "stale" : "check";
}

export function freshnessLabel(rules: Rules, chain: string, at: string | null, now = Date.now()): string {
  const parts = [FRESHNESS[freshness(rules, chain, at, now)]];
  const note = rules.freshness[chain]?.note;
  if (chain === "perekrestok" || (note && note.includes(PEREKRESTOK_NOTE))) parts.push(PEREKRESTOK_NOTE);
  else if (note && !parts.includes(note)) parts.push(note);
  return parts.filter(Boolean).join(", ");
}

/** Recommended option's chains (same rule as cart.open_urls). */
export function openChains(c: Comparison): string[] {
  const out: string[] = [];
  if (c.bestSplit && c.bestSingle && c.bestSplit.n === c.bestSingle.n && c.bestSplit.total < c.bestSingle.total) {
    return c.bestSplit.baskets.map((b) => b.chain);
  }
  if (c.bestSingle) {
    out.push(c.bestSingle.chain);
    for (const b of c.bestSplit?.baskets ?? []) if (!out.includes(b.chain)) out.push(b.chain);
  }
  return out;
}
