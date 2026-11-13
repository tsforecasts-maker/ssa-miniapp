import type { CatalogItem, HouseholdInfo, Offer, Pick, Rules } from "./lib/compare";
import { initData } from "./tg";

// Public project URL of the Supabase Edge Function (auth is the Telegram initData header, not a key).
export const API = "https://fejhhpmfxusqinwnrhrw.supabase.co/functions/v1/ssa-miniapp-api";

export interface Boot {
  user: { id: number; first_name: string | null; username: string | null };
  role: string; household_id: number; synced_at: string | null;
  catalog: { categories: { id: number; name: string }[]; items: CatalogItem[] };
  offers: Offer[]; rules: Rules; household: HouseholdInfo; products: Pick[];
}

export class ApiError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(`${API}/${path}`, {
      method, signal: ctl.signal,
      headers: { "x-tg-init-data": initData(), ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new ApiError(r.status, (await r.json().catch(() => ({}))).error ?? "error");
    return (await r.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, "network");
  } finally { clearTimeout(timer); }
}

export const bootstrap = () => call<Boot>("GET", "bootstrap");
export const putProduct = (catalog_id: number, qty: number, brand: string | null) =>
  call<{ ok: boolean }>("PUT", "products", { catalog_id, qty, brand });
