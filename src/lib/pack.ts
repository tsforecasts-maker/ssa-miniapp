// Checked "added to the store cart" flags, persisted per household + chain + Moscow date.

function todayMSK(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
}

export function packKey(householdId: number, chain: string, date = todayMSK()): string {
  return `ssa:pack:${householdId}:${chain}:${date}`;
}

export function loadChecked(householdId: number, chain: string): Set<number> {
  try {
    const raw = localStorage.getItem(packKey(householdId, chain));
    const ids: number[] = raw ? JSON.parse(raw) : [];
    return new Set(ids.filter((n) => Number.isInteger(n)));
  } catch { return new Set(); }
}

export function saveChecked(householdId: number, chain: string, ids: Set<number>): void {
  try { localStorage.setItem(packKey(householdId, chain), JSON.stringify([...ids])); } catch { /* quota */ }
}

export function resetChecked(householdId: number, chains: string[]): void {
  for (const c of chains) {
    try { localStorage.removeItem(packKey(householdId, c)); } catch { /* ignore */ }
  }
}

export type PackItemRef = { chain: string; id: number };

/** Next unchecked row: finish the current chain first, then later blocks, then earlier ones. */
export function nextUnchecked(
  rows: PackItemRef[],
  checked: Map<string, Set<number>>,
  last: PackItemRef | null = null,
): PackItemRef | null {
  const open = rows.filter((r) => !checked.get(r.chain)?.has(r.id));
  if (!open.length) return null;
  if (!last) return open[0];
  const idx = rows.findIndex((r) => r.chain === last.chain && r.id === last.id);
  const after = (list: PackItemRef[]) =>
    list.filter((r) => rows.findIndex((x) => x.chain === r.chain && x.id === r.id) > idx);
  const same = open.filter((r) => r.chain === last.chain);
  if (same.length) return after(same)[0] ?? same[0];
  const later = after(open);
  return later[0] ?? open[0];
}
