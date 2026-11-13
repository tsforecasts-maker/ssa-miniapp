import { computed, signal } from "@preact/signals";
import { bootstrap, ApiError, putProduct, type Boot } from "./api";
import { compare, type Data, type Pick } from "./lib/compare";
import { haptic } from "./tg";

export type Tab = "home" | "catalog" | "cart" | "profile";
export type View = { tab: Tab; cat?: number; where?: boolean };

const CACHE_KEY = "ssa:boot:v1";
export const boot = signal<Boot | null>(null);
export const picks = signal<Pick[]>([]);
export const status = signal<"loading" | "ready" | "forbidden" | "offline" | "no_telegram">("loading");
export const refreshing = signal(false);
export const view = signal<View>({ tab: "home" });
export const sheet = signal<number | null>(null); // catalogue id shown in the product sheet
export const toast = signal<string | null>(null);

export const data = computed<Data | null>(() => {
  const b = boot.value;
  return b ? { items: b.catalog.items, offers: b.offers, rules: b.rules, household: b.household } : null;
});
export const result = computed(() => (data.value ? compare(data.value, picks.value) : null));
export const pickMap = computed(() => new Map(picks.value.map((p) => [p.catalog_id, p])));

function apply(b: Boot): void {
  boot.value = b;
  picks.value = b.products;
  status.value = "ready";
}

export async function load(hasInitData: boolean): Promise<void> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) apply(JSON.parse(raw) as Boot);
  } catch { /* ignore broken cache */ }
  if (!hasInitData) { if (!boot.value) status.value = "no_telegram"; return; }
  refreshing.value = true;
  try {
    const b = await bootstrap();
    apply(b);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(b)); } catch { /* quota */ }
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) { boot.value = null; status.value = "forbidden"; localStorage.removeItem(CACHE_KEY); }
    else if (!boot.value) status.value = "offline";
    else flash("Нет связи — показаны сохранённые данные");
  } finally { refreshing.value = false; }
}

export function flash(msg: string): void {
  toast.value = msg;
  setTimeout(() => { if (toast.value === msg) toast.value = null; }, 2600);
}

// ---- picks: optimistic update, one pending PUT per product (last write wins) ----
const timers = new Map<number, number>();

export function setPick(id: number, qty: number, brand?: string | null, rule?: number): void {
  const cur = pickMap.value.get(id);
  const next: Pick | null = qty <= 0 ? null : {
    catalog_id: id, qty,
    brand: brand === undefined ? cur?.brand ?? null : brand,
    rule: rule === undefined ? cur?.rule ?? 2 : rule,
  };
  picks.value = [...picks.value.filter((p) => p.catalog_id !== id), ...(next ? [next] : [])];
  haptic();
  clearTimeout(timers.get(id));
  timers.set(id, window.setTimeout(async () => {
    timers.delete(id);
    try { await putProduct(id, next ? next.qty! : 0, next?.brand ?? null, next?.rule ?? 2); }
    catch { flash("Не удалось сохранить, попробуйте ещё раз"); void load(true); }
  }, 350));
}

export const go = (v: View): void => { view.value = v; window.scrollTo(0, 0); };
