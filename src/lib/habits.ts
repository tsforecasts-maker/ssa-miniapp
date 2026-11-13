export const GROUPS = ["regular", "favorite", "periodic", "impulse"] as const;
export type GroupKey = (typeof GROUPS)[number];

export interface HabitItem {
  id: number;
  sku_id: string;
  name: string;
  img?: string | null;
  receipts: number;
  in_household: boolean;
  source: "auto" | "user";
}

export interface HabitGroup {
  key: GroupKey;
  title: string;
  caption: string;
  items: HabitItem[];
}

export interface Habits {
  updated_at: string | null;
  fill_pct: number;
  fill_note?: string;
  n_receipts: number;
  n_purchases: number;
  period_from: string | null;
  period_to: string | null;
  savings: { pct?: number; amount?: number } | null;
  savings_note?: string;
  receipts: { date: string; chain: string; chain_name: string; total: number; items: number }[];
  groups: Record<GroupKey, HabitGroup>;
}

export const GROUP_META: Record<GroupKey, { title: string; caption: string; color: string }> = {
  regular: { title: "Постоянные", caption: "Уже покупали больше одного раза", color: "green" },
  favorite: { title: "Любимые", caption: "Не меняем бренд", color: "blue" },
  periodic: { title: "Периодические", caption: "В списке семьи, в чеках пока редко", color: "orange" },
  impulse: { title: "Импульсные", caption: "Встречались в чеках один раз", color: "purple" },
};

export function countsOf(h: Habits | null | undefined): Record<GroupKey, number> {
  const z = { regular: 0, favorite: 0, periodic: 0, impulse: 0 };
  if (!h?.groups) return z;
  for (const g of GROUPS) z[g] = h.groups[g]?.items?.length ?? 0;
  return z;
}

export function totalOf(h: Habits | null | undefined): number {
  const c = countsOf(h);
  return GROUPS.reduce((n, g) => n + c[g], 0);
}

export function applyOverrides(habits: Habits, overrides: Record<string, string> | null | undefined): Habits {
  if (!overrides || !Object.keys(overrides).length) return habits;
  const grouped: Record<GroupKey, HabitItem[]> = { regular: [], favorite: [], periodic: [], impulse: [] };
  for (const g of GROUPS) {
    for (const raw of habits.groups?.[g]?.items ?? []) {
      const dest = (overrides[String(raw.id)] as GroupKey) || g;
      const it = { ...raw };
      if (overrides[String(raw.id)]) it.source = "user";
      if (GROUPS.includes(dest)) grouped[dest].push(it);
      else grouped[g].push(it);
    }
  }
  const groups = { ...habits.groups };
  for (const g of GROUPS) {
    groups[g] = {
      key: g,
      title: GROUP_META[g].title,
      caption: GROUP_META[g].caption,
      items: [...grouped[g]].sort((a, b) => a.name.localeCompare(b.name, "ru")),
    };
  }
  return { ...habits, groups };
}

export function moveItem(habits: Habits, id: number, dest: GroupKey): Habits {
  return applyOverrides(habits, { [String(id)]: dest });
}

export const WELCOME_KEY = "ssa:welcome:v1";
export const welcomeSeen = (): boolean => {
  try { return localStorage.getItem(WELCOME_KEY) === "1"; } catch { return true; }
};
export const markWelcomeSeen = (): void => {
  try { localStorage.setItem(WELCOME_KEY, "1"); } catch { /* quota */ }
};

export function todayMsk(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date(iso)) === fmt.format(new Date());
}

export function dateRu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = iso.slice(0, 10).split("-");
  if (d.length !== 3) return iso;
  return `${d[2]}.${d[1]}`;
}

export function dateRangeRu(from: string | null, to: string | null): string {
  if (!from && !to) return "";
  if (from && to && from !== to) return `${dateRu(from)}–${dateRu(to)}`;
  return dateRu(from || to);
}

export function dateFullRu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = iso.slice(0, 10).split("-");
  if (d.length !== 3) return iso;
  return `${d[2]}.${d[1]}.${d[0]}`;
}
